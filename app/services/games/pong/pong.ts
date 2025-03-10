import { GameBase, GameStatus } from "../gameBase";
import { PhysicsEngine, Collision } from "../physicsEngine";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { Paddle } from "../../../types/games/pong/paddle";
import { Ball } from "../../../types/games/pong/ball";
import { Rectangle } from "../../../types/games/pong/rectangle";

const EPSILON = 1e-2;

// Temporary:
interface Player {
  id: number;
}

export interface PongExtraGameData {
  playerCount: number;
  lastHit: number;
  players?: Player[];
  scores: number[];
}

export interface PongGameObjects {
  balls: Ball[];
  paddles: Paddle[];
  walls: Rectangle[];
}

// Define types for our edit operations
export interface GameObjectEdit<T = any> {
  targetId: number;
  targetType: string;
  property: string;
  editor: (currentValue: any) => any;
}

// Define a type for the edit function
type PropertyEditor<T, K extends keyof T> = (value: T[K]) => T[K];

export abstract class Pong extends GameBase {
  static readonly name = "pong";

  protected serverMaxDelayTicks: number;

  protected tickData: Record<string, any>[];
  protected tickDataLock: Promise<void> | null = null;

  protected extraGameData: PongExtraGameData;

  protected gameObjects: PongGameObjects;
  protected gameObjectsLock: Promise<void> | null = null;

  protected arenaSettings: Record<string, any>;

  protected pendingEdits: GameObjectEdit[] = [];
  protected editsQueueLock: Promise<void> | null = null;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    // Registry settings
    this.serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    this.serverMaxDelayTicks = GAME_REGISTRY.pong.serverMaxDelayTicks;
    this.arenaSettings =
      GAME_REGISTRY.pong.gameModes[gameData["gameModeName"]].arenaSettings;

    // Network playability related
    this.tickData = new Array(this.serverMaxDelayTicks);

    // Players & related
    this.extraGameData = {
      playerCount: gameData["playerCount"],
      lastHit: -1,
      scores: Array(gameData["playerCount"]).fill(0),
    };

    // Game objects -> w/ collisions
    this.gameObjects = {
      balls: [],
      paddles: [],
      walls: [],
    };
  }

  // Modified update method that incorporates queued edits
  update(): void {
    this.processQueuedEdits();

    // Update game state
    if (this.status === GameStatus.RUNNING) {
      // Update paddle positions
      for (const paddle of this.gameObjects.paddles) {
        if (paddle.velocity !== 0) {
          this.queuePaddleUpdate(paddle);
        }
      }

      // Update ball positions
      for (const ball of this.gameObjects.balls) {
        if (ball.doCollision) {
          this.doCollisionChecks(ball);
        } else {
          // Queue ball movement for balls without collision
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "x",
            editor: (x) => x + Math.round(ball.dx * ball.speed * 100) / 100,
          });
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "y",
            editor: (y) => y + Math.round(ball.dy * ball.speed * 100) / 100,
          });
        }
      }

      // Apply all the queued edits from paddle and ball updates
      this.processQueuedEdits();

      // Trigger modifiers
      this.modifierManager.trigger("onUpdate");
    }

    // Save the current state for potential rewinding
    const snapshot = this.getStateSnapshot();
    this.saveStateSnapshot(snapshot);
  }

  // Queue a paddle update instead of directly modifying it
  protected queuePaddleUpdate(paddle: Paddle): void {
    if (!paddle.doMove) {
      console.log(
        `Player ${this.gameObjects.paddles.indexOf(paddle)}'s paddle can't be moved`,
      );
      return;
    }

    const direction = paddle.velocity > 0 ? 1 : -1;
    const newDisplacement =
      paddle.displacement +
      direction * this.arenaSettings.paddleSpeedWidthPercent;

    // Check if movement would exceed boundaries
    if (
      (direction > 0 &&
        newDisplacement >
          this.arenaSettings.height / 2.0 - paddle.coverage / 2.0) ||
      (direction < 0 &&
        newDisplacement <
          -(this.arenaSettings.height / 2.0 - paddle.coverage / 2.0))
    ) {
      console.log(`Can't move in this direction anymore`);
      return;
    }

    // Queue position updates
    this.pendingEdits.push({
      targetId: paddle.id,
      targetType: "paddles",
      property: "x",
      editor: (x) => x + paddle.velocity * paddle.dx,
    });

    this.pendingEdits.push({
      targetId: paddle.id,
      targetType: "paddles",
      property: "y",
      editor: (y) => y + paddle.velocity * paddle.dy,
    });

    this.pendingEdits.push({
      targetId: paddle.id,
      targetType: "paddles",
      property: "displacement",
      editor: (_) => newDisplacement,
    });

    // After updating, trigger the modifier
    const paddleIndex = this.gameObjects.paddles.indexOf(paddle);
    this.modifierManager.trigger("onPlayerMovement", {
      playerId: paddleIndex,
    });
  }

  // TODO: Use userInput schema for received action
  // Handle player actions with lag compensation
  async handleAction(action: Record<string, any>): Promise<void> {
    if (
      !(
        action.playerId >= 0 && action.playerId < this.extraGameData.playerCount
      )
    ) {
      console.log(
        `Can't handle player ${action.playerId}'s action: game has ${this.extraGameData.playerCount} players`,
      );
      return;
    }

    const delayS = (this.lastUpdateTime - action.timestamp) / 1000.0;
    const delayTicks = Math.round(delayS / this.serverTickrateS);

    if (delayTicks > this.serverMaxDelayTicks) {
      console.log(
        `Player ${action.playerId} has really high ping -> disconnecting`,
      );
      // TODO: Disconnection in case of high ping
      return;
    }

    // Rewind game state if needed
    if (delayTicks > 0) {
      console.log(`Rewinding ${delayTicks} ticks`);
      await this.rewind(delayTicks);
    }

    // Queue the player's action as an edit
    const release = await this.acquireLock();
    try {
      switch (action.type) {
        case "UP":
          this.pendingEdits.push({
            targetId: action.playerId,
            targetType: "paddles",
            property: "velocity",
            editor: (_) => this.gameObjects.paddles[action.playerId].speed,
          });
          break;

        case "DOWN":
          this.pendingEdits.push({
            targetId: action.playerId,
            targetType: "paddles",
            property: "velocity",
            editor: (_) => -this.gameObjects.paddles[action.playerId].speed,
          });
          break;

        case "STOP":
          this.pendingEdits.push({
            targetId: action.playerId,
            targetType: "paddles",
            property: "velocity",
            editor: (_) => 0.0,
          });
          break;
      }
    } finally {
      release();
    }

    // Apply edits immediately since we're in a rewound state
    this.processQueuedEdits();

    // Trigger modifiers for user input
    this.modifierManager.trigger("onUserInput", { input: action });

    // Fast-forward back to current state
    if (delayTicks > 0) {
      console.log(`Fast-forwarding ${delayTicks} ticks`);
      await this.fastForward(delayTicks);
    }
  }

  // TODO: Use gameState schema
  getStateSnapshot(): Record<string, any> {
    const gameState = super.getStateSnapshot();

    gameState.balls = this.gameObjects.balls;
    gameState.paddles = this.gameObjects.paddles;
    gameState.walls = this.gameObjects.walls;
    gameState.scores = this.extraGameData.scores;
    gameState.rng = this.rng.getState();

    gameState.modifiersData = this.modifierManager.getStateSnapshot();

    return gameState;
  }

  // TODO: Use gameState schema
  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.gameObjects.balls = snapshot.balls;
    this.gameObjects.walls = snapshot.walls;
    this.gameObjects.paddles = snapshot.player_paddles;
    this.extraGameData.scores = snapshot.scores;

    this.modifierManager.loadStateSnapshot(snapshot.modifiersData);

    this.rng.setState(snapshot.rng);
  }

  // Save a state snapshot with properly acquired lock
  protected async saveStateSnapshot(
    snapshot: Record<string, any>,
  ): Promise<void> {
    if (this.tickDataLock === null) {
      this.tickDataLock = Promise.resolve();
    }

    await this.tickDataLock.then(async () => {
      this.tickDataLock = new Promise<void>((resolve) => {
        this.tickData.push(snapshot);
        // Limit the history length if needed
        if (this.tickData.length > this.serverMaxDelayTicks) {
          this.tickData.shift();
        }
        resolve();
      });
    });
  }

  // The rewind and fastForward methods can remain largely the same
  async rewind(toTick: number): Promise<void> {
    if (toTick > this.tickData.length) {
      console.log(`Can't rewind that far -> rewinding as much as possible`);
      toTick = this.tickData.length;
    }

    this.loadStateSnapshot(this.tickData[this.tickData.length - toTick]);
  }

  async fastForward(tickCount: number): Promise<void> {
    // Remove the outdated ticks from the end
    if (this.tickDataLock === null) {
      this.tickDataLock = Promise.resolve();
    }

    await this.tickDataLock.then(async () => {
      this.tickDataLock = new Promise<void>((resolve) => {
        for (let i = 0; i < tickCount; i++)
          if (this.tickData.length > 0) this.tickData.pop();
        resolve();
      });
    });

    // Re-simulate the ticks one by one
    for (let i = 0; i < tickCount; i++) {
      // Use update instead of simulateTick
      this.update();

      // State snapshots are now saved within the update method
    }
  }

  // Replaced with queuePaddleUpdate method that uses the edit queue
  updatePaddle(paddle: Paddle): void {
    this.queuePaddleUpdate(paddle);
  }

  // Updated to use edit queue
  async resetBall(ballId: number = -1): Promise<void> {}

  abstract isOutOfBounds(ball: Ball): boolean;

  doCollisionChecks(ball: Ball): void {
    const getClosestCollision = (
      collisions: Array<Collision | null>,
    ): Collision | null => {
      let minIndex = -1;
      let minValue = Infinity;

      for (let k = 0; k < collisions.length; k++) {
        if (!collisions[k]) continue;

        if (collisions[k]!.distance < minValue) {
          minValue = collisions[k]!.distance;
          minIndex = k;
        }
      }

      return minIndex >= 0 ? collisions[minIndex] : null;
    };

    let remainingDistance = ball.speed;
    let loopCounter = 0;

    while (remainingDistance > EPSILON) {
      const paddleCollision: Collision | null = PhysicsEngine.detectCollision(
        ball,
        remainingDistance,
        this.gameObjects.paddles,
        "paddle",
      );

      const wallCollision: Collision | null = PhysicsEngine.detectCollision(
        ball,
        remainingDistance,
        this.gameObjects.walls,
        "wall",
      );

      const powerUpCollision: Collision | null = PhysicsEngine.detectCollision(
        ball,
        remainingDistance,
        this.modifierManager.getSpawnedPowerUsObjects(),
        "powerUp",
      );

      // Determine the closest collision
      const tmpCollision: Collision | null = getClosestCollision([
        paddleCollision,
        wallCollision,
        powerUpCollision,
      ]);

      if (!tmpCollision) {
        // Queue normal movement if no collision
        this.pendingEdits.push({
          targetId: ball.id,
          targetType: "balls",
          property: "x",
          editor: (x) =>
            x + Math.round(ball.dx * remainingDistance * 100) / 100,
        });

        this.pendingEdits.push({
          targetId: ball.id,
          targetType: "balls",
          property: "y",
          editor: (y) =>
            y + Math.round(ball.dy * remainingDistance * 100) / 100,
        });
        break;
      }

      let collision: Collision = tmpCollision as Collision;
      const travelDistance = collision.distance;

      // Queue movement up to collision point
      this.pendingEdits.push({
        targetId: ball.id,
        targetType: "balls",
        property: "x",
        editor: (x) => x + Math.round(ball.dx * travelDistance * 100) / 100,
      });

      this.pendingEdits.push({
        targetId: ball.id,
        targetType: "balls",
        property: "y",
        editor: (y) => y + Math.round(ball.dy * travelDistance * 100) / 100,
      });

      switch (collision.type) {
        case "powerUp":
          console.log(
            `\nPlayer ${this.extraGameData.lastHit} picked up a powerUp\n`,
          );

          this.modifierManager.pickupPowerUp(collision.objectId);
          break;

        case "paddle":
          // Compute reflection variables before queueing edits
          const paddleNormal = collision.normal!;
          const paddleDotProduct =
            2 * (ball.dx * paddleNormal[0] + ball.dy * paddleNormal[1]);
          const newPaddleDx = ball.dx - paddleDotProduct * paddleNormal[0];
          const newPaddleDy = ball.dy - paddleDotProduct * paddleNormal[1];

          // Normalize direction
          const paddleSpeed = Math.sqrt(newPaddleDx ** 2 + newPaddleDy ** 2);
          const normalizedPaddleDx = newPaddleDx / paddleSpeed;
          const normalizedPaddleDy = newPaddleDy / paddleSpeed;

          // Queue updates to direction vectors
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "dx",
            editor: (_) => normalizedPaddleDx,
          });

          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "dy",
            editor: (_) => normalizedPaddleDy,
          });

          // Move the ball slightly outside the collision surface to prevent sticking
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "x",
            editor: (x) => x + paddleNormal[0] * EPSILON * 10,
          });

          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "y",
            editor: (y) => y + paddleNormal[1] * EPSILON * 10,
          });

          const playerId = collision.objectId;

          // Update lastHit through edit queue
          this.pendingEdits.push({
            targetId: -2, // Special identifier for extraGameData
            targetType: "",
            property: "lastHit",
            editor: (_) => playerId,
          });

          console.log(`Last hit: ${playerId}`);

          // Then trigger paddle bounce effects
          this.modifierManager.trigger("onPaddleBounce", {
            playerId: collision.objectId,
          });
          break;

        case "wall":
          // Compute reflection variables before queueing edits
          const wallNormal = collision.normal!;
          const wallDotProduct =
            2 * (ball.dx * wallNormal[0] + ball.dy * wallNormal[1]);
          const newWallDx = ball.dx - wallDotProduct * wallNormal[0];
          const newWallDy = ball.dy - wallDotProduct * wallNormal[1];

          // Normalize direction
          const wallSpeed = Math.sqrt(newWallDx ** 2 + newWallDy ** 2);
          const normalizedWallDx = newWallDx / wallSpeed;
          const normalizedWallDy = newWallDy / wallSpeed;

          // Queue updates to direction vectors
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "dx",
            editor: (_) => normalizedWallDx,
          });

          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "dy",
            editor: (_) => normalizedWallDy,
          });

          // Move the ball slightly outside the collision surface to prevent sticking
          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "x",
            editor: (x) => x + wallNormal[0] * EPSILON * 10,
          });

          this.pendingEdits.push({
            targetId: ball.id,
            targetType: "balls",
            property: "y",
            editor: (y) => y + wallNormal[1] * EPSILON * 10,
          });

          // TODO: Bounce or Goal ?
          const wall: Rectangle = this.gameObjects.walls[collision.objectId];
          if (wall.isGoal) {
            const goalPlayerId = Math.floor(collision.objectId / 2);

            // Update the scores through edit queue
            this.pendingEdits.push({
              targetId: -2, // Special identifier for extraGameData
              targetType: "",
              property: "scores",
              editor: (scores) => {
                const newScores = [...scores];
                newScores[goalPlayerId]++;
                return newScores;
              },
            });

            // Then trigger goal effects
            this.modifierManager.trigger("onGoal", {
              playerId: goalPlayerId,
            });
          } else this.modifierManager.trigger("onWallBounce");
          break;

        default:
          console.log(`Unknown collision type: ${collision.type}`);
      }

      remainingDistance -= travelDistance;

      loopCounter += 1;
      if (loopCounter > ball.speed * 3.0 + 1) {
        break;
      }
    }

    // Process all the edits we've queued during collision checks
    this.processQueuedEdits();
  }

  // Getters & Setters
  getExtraGameData(): PongExtraGameData {
    return this.extraGameData;
  }

  // Updated to use edit queue
  async editScore(id: number, delta: number): Promise<void> {
    const release = await this.acquireLock();
    try {
      this.pendingEdits.push({
        targetId: -2, // Special identifier for extraGameData
        targetType: "",
        property: "scores",
        editor: (scores) => {
          const newScores = [...scores];
          newScores[id] += delta;
          return newScores;
        },
      });
    } finally {
      release();
    }
    this.processQueuedEdits();
  }

  // Updated to use edit queue
  async setLastHit(id: number): Promise<void> {
    const release = await this.acquireLock();
    try {
      this.pendingEdits.push({
        targetId: -2, // Special identifier for extraGameData
        targetType: "",
        property: "lastHit",
        editor: (_) => id,
      });
    } finally {
      release();
    }

    this.processQueuedEdits();
    console.log(`New lastHit: ${this.extraGameData.lastHit}`);
  }

  // Reading gameObjects is safe without locks as long as you only read
  // within the update method or after ensuring all edits are processed
  getGameObjectsReadOnly(): Readonly<PongGameObjects> {
    // Return a readonly version of the game objects
    // This is safe to call from anywhere
    return this.gameObjects as Readonly<PongGameObjects>;
  }

  // For the modifier system
  findGameObject(id: number, category: string = ""): any | null {
    // Special cases for our identifier system
    if (id === -1) return this.gameObjects; // For array replacements
    if (id === -2) return this.extraGameData; // For extraGameData changes

    let found: any;
    switch (category) {
      case "balls":
        found = this.gameObjects.balls.find((obj) => obj.id === id);
        if (found) return found;
        break;

      case "paddles":
        found = this.gameObjects.paddles.find((obj) => obj.id === id);
        if (found) return found;
        break;

      case "walls":
        found = this.gameObjects.walls.find((obj) => obj.id === id);
        if (found) return found;
        break;

      default:
        for (const category of ["balls", "paddles", "walls"] as const) {
          found = this.gameObjects[category].find((obj) => obj.id === id);
          if (found) return found;
        }
    }

    return null;
  }

  // -- Async Safety methods -- //
  async editGameObject<T, K extends keyof T>(
    obj: T,
    property: K,
    editor: PropertyEditor<T, K>,
  ): Promise<void> {
    const release = await this.acquireLock();
    try {
      // Apply the edit
      obj[property] = editor(obj[property]);
    } finally {
      release();
    }
  }

  // Process all queued edits
  protected processQueuedEdits(): void {
    if (this.pendingEdits.length === 0) return;

    for (const edit of this.pendingEdits) {
      const target = this.findGameObject(edit.targetId, edit.targetType);

      if (target) {
        if (edit.targetId === -1 && edit.property === "balls") {
          // Special case for balls array replacement
          this.gameObjects.balls = edit.editor([]);
        } else if (edit.targetId >= 0 && edit.property === "ballReset") {
          // Special case for individual ball reset
          const ballData = edit.editor(null);
          const existingBallIndex = this.gameObjects.balls.findIndex(
            (b) => b.id === edit.targetId,
          );

          if (existingBallIndex >= 0) {
            this.gameObjects.balls[existingBallIndex] = ballData;
          } else {
            this.gameObjects.balls.push(ballData);
          }
        } else {
          // Normal property edit
          target[edit.property] = edit.editor(target[edit.property]);
        }
      }
    }

    // Clear the queue after processing
    this.pendingEdits = [];
  }

  // Acquire lock for the edits queue
  protected async acquireLock(): Promise<() => void> {
    if (this.editsQueueLock) {
      await this.editsQueueLock;
    }

    let releaseLock!: () => void;
    this.editsQueueLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    return releaseLock;
  }
}
