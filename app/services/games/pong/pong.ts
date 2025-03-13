import { GameBase, GameStatus } from "../gameBase";
import { PhysicsEngine, type Collision } from "../physicsEngine";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import type { Paddle } from "../../../types/games/pong/paddle";
import type { Ball } from "../../../types/games/pong/ball";
import type { Rectangle } from "../../../types/games/pong/rectangle";
import { EditManager, type Editable } from "../editManager";

const EPSILON = 1e-2;

// Temporary:
interface Player {
  id: number;
}

// Define an enum to make target types explicit.
export enum TargetType {
  Balls = "balls",
  Paddles = "paddles",
  Walls = "walls",
  ExtraGameDataScores = "extraGameDataScores",
  ExtraGameDataLastHit = "extraGameDataLastHit",
  Status = "status",
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

export abstract class Pong extends GameBase implements Editable<TargetType> {
  static readonly name = "pong";

  protected serverMaxDelayTicks: number;

  protected tickData: Record<string, any>[];
  protected tickDataLock: Promise<void> | null = null;

  protected extraGameData: PongExtraGameData;

  protected gameObjects: PongGameObjects;
  protected gameObjectsLock: Promise<void> | null = null;

  protected arenaSettings: Record<string, any>;

  // EditManager instance
  protected editManager: EditManager<TargetType>;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    // Registry settings
    this.serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    const serverMaxDelayS = GAME_REGISTRY.pong.serverMaxDelayS;
    this.serverMaxDelayTicks = serverMaxDelayS * this.serverTickrateS;

    this.arenaSettings =
      GAME_REGISTRY.pong.gameModes[gameData.gameModeName].arenaSettings;

    // Network playability related
    this.tickData = new Array(this.serverMaxDelayTicks);

    // Players & related
    this.extraGameData = {
      playerCount: gameData.playerCount,
      lastHit: -1,
      scores: Array(gameData.playerCount).fill(0),
    };

    // Game objects -> w/ collisions
    this.gameObjects = {
      balls: [],
      paddles: [],
      walls: [],
    };

    // Initialize EditManager
    this.editManager = new EditManager<TargetType>(this);
  }

  // Implementation of Editable interface
  findTarget(targetId: number, targetType: TargetType): any | null {
    switch (targetType) {
      case TargetType.Status:
        return this.status;

      case TargetType.ExtraGameDataScores:
        // For scores, return the entire array if targetId === -1,
        // otherwise return the specific score element if within bounds.
        if (targetId === -1) return this.extraGameData.scores;
        if (targetId >= 0 && targetId < this.extraGameData.scores.length) {
          return this.extraGameData.scores[targetId];
        }
        break;

      case TargetType.ExtraGameDataLastHit:
        return this.extraGameData.lastHit;

      case TargetType.Balls:
      case TargetType.Paddles:
      case TargetType.Walls: {
        // For game object arrays, use the enum value as the key in gameObjects.
        const arr = this.gameObjects[targetType];
        if (targetId === -1) return arr;
        if (targetId >= 0 && targetId < arr.length) return arr[targetId];
        break;
      }
    }
    return null;
  }

  applyUpdate(
    targetType: TargetType,
    targetId: number,
    updates: Record<string, any>,
  ): void {
    switch (targetType) {
      case TargetType.Status:
        this.status = updates.status;
        break;

      case TargetType.ExtraGameDataScores:
        if (targetId === -1) {
          // Replace the whole scores array
          this.extraGameData.scores = updates.scores;
        } else if (
          targetId >= 0 &&
          targetId < this.extraGameData.scores.length
        ) {
          // Update a specific score
          const newScores = [...this.extraGameData.scores];
          newScores[targetId] = updates.primitive;
          this.extraGameData.scores = newScores;
        } else {
          console.warn(`Score index ${targetId} is out of bounds`);
        }
        break;

      case TargetType.ExtraGameDataLastHit:
        this.extraGameData.lastHit = updates.lastHit;
        break;

      case TargetType.Balls:
        const updatedBalls = this.updateGameObjectArray(
          this.gameObjects.balls,
          targetId,
          updates,
        );
        if (updatedBalls) {
          this.gameObjects.balls = updatedBalls;
        }
        break;

      case TargetType.Paddles:
        const updatedPaddles = this.updateGameObjectArray(
          this.gameObjects.paddles,
          targetId,
          updates,
        );
        if (updatedPaddles) {
          this.gameObjects.paddles = updatedPaddles;
        }
        break;

      case TargetType.Walls:
        const updatedWalls = this.updateGameObjectArray(
          this.gameObjects.walls,
          targetId,
          updates,
        );
        if (updatedWalls) {
          this.gameObjects.walls = updatedWalls;
        }
        break;

      default:
        console.warn(`Unknown target type: ${targetType}`);
    }
  }

  // Helper method to update arrays of game objects
  private updateGameObjectArray<T extends Record<string, any>>(
    arr: T[],
    targetId: number,
    updates: Record<string, any>,
  ): T[] | null {
    if (targetId === -1) {
      // If 'array' key exists in updates, use it to replace the entire array
      if ("array" in updates) {
        return updates.array as T[];
      }
      console.warn(
        'Attempted to replace entire array but no "array" key provided in updates',
      );
      return null;
    }

    if (targetId >= 0 && targetId < arr.length) {
      // Update a specific object
      const newArray = [...arr];
      const updatedObject = { ...newArray[targetId] } as Record<string, any>;

      // Apply each update to the object
      for (const [key, value] of Object.entries(updates)) {
        updatedObject[key] = value;
      }

      newArray[targetId] = updatedObject as T;
      return newArray;
    } else {
      console.warn(`Array index ${targetId} is out of bounds`);
      return null;
    }
  }

  startGame(): void {
    this.status = GameStatus.RUNNING;

    // this.editManager.processQueuedEdits();
    // this.modifierManager.trigger("onGameStart");
  }

  update(): void {
    this.editManager.processQueuedEdits();

    // Update game state
    if (this.status === GameStatus.RUNNING) {
      // Update paddle positions
      for (const paddle of this.gameObjects.paddles)
        if (paddle.velocity !== 0) this.queuePaddleUpdate(paddle);

      // Update ball positions
      for (const ball of this.gameObjects.balls)
        if (ball.doCollision) this.doCollisionChecks(ball);

      // Apply all the queued edits from paddle and ball updates
      this.editManager.processQueuedEdits();

      // Verify that no balls went out of bounds
      this.gameObjects.balls.forEach((ball, id) => {
        if (this.isOutOfBounds(ball)) this.resetBall(id);
      });

      // Trigger modifiers
      this.modifierManager.trigger("onUpdate");
    }

    // Save the current state for potential rewinding
    const snapshot = this.getStateSnapshot();
    this.saveStateSnapshot(snapshot);
  }

  protected queuePaddleUpdate(paddle: Paddle): void {
    if (!paddle.doMove) {
      console.log(
        `Player ${this.gameObjects.paddles.indexOf(paddle)}'s paddle can't be moved`,
      );
      return;
    }

    const direction = paddle.velocity > 0 ? 1 : -1;
    const newDisplacement = paddle.displacement + direction * paddle.speed;

    // Calculate movement boundaries based on paddle coverage
    const maxDisplacement = (100 - paddle.coverage) / 2; // The paddle moves within (-max, +max)

    // Check if movement would exceed boundaries
    if (
      newDisplacement > maxDisplacement ||
      newDisplacement < -maxDisplacement
    ) {
      console.log(`Can't move in this direction anymore`);
      return;
    }

    // Queue position updates
    this.editManager.queueEdit({
      targetId: paddle.id,
      targetType: TargetType.Paddles,
      property: "x",
      editor: (x) => x + paddle.velocity * paddle.dx,
    });

    this.editManager.queueEdit({
      targetId: paddle.id,
      targetType: TargetType.Paddles,
      property: "y",
      editor: (y) => y + paddle.velocity * paddle.dy,
    });

    this.editManager.queueEdit({
      targetId: paddle.id,
      targetType: TargetType.Paddles,
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
    switch (action.type) {
      case "UP":
        this.editManager.queueEdit({
          targetId: action.playerId,
          targetType: TargetType.Paddles,
          property: "velocity",
          editor: (_) => this.gameObjects.paddles[action.playerId].speed,
        });
        break;

      case "DOWN":
        this.editManager.queueEdit({
          targetId: action.playerId,
          targetType: TargetType.Paddles,
          property: "velocity",
          editor: (_) => -this.gameObjects.paddles[action.playerId].speed,
        });
        break;

      case "STOP":
        this.editManager.queueEdit({
          targetId: action.playerId,
          targetType: TargetType.Paddles,
          property: "velocity",
          editor: (_) => 0.0,
        });
        break;
    }

    // Apply edits immediately since we're in a rewound state
    this.editManager.processQueuedEdits();

    // Trigger modifiers for user input
    this.modifierManager.trigger("onUserInput", { input: action });

    // Fast-forward back to current state
    if (delayTicks > 0) {
      console.log(`Fast-forwarding ${delayTicks} ticks`);
      await this.fastForward(delayTicks);
    }
  }

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

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.gameObjects.balls = snapshot.balls;
    this.gameObjects.walls = snapshot.walls;
    this.gameObjects.paddles = snapshot.player_paddles;
    this.extraGameData.scores = snapshot.scores;

    this.modifierManager.loadStateSnapshot(snapshot.modifiersData);

    this.rng.setState(snapshot.rng);
  }

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

  updatePaddle(paddle: Paddle): void {
    this.queuePaddleUpdate(paddle);
  }

  abstract isOutOfBounds(ball: Ball): boolean;

  abstract resetBall(ballId: number): void;

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
      // Make sure to compute using the most recent values
      this.editManager.processQueuedEdits();

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
        this.editManager.queueEdit({
          targetId: ball.id,
          targetType: TargetType.Balls,
          property: "x",
          editor: (x) =>
            x + Math.round(ball.dx * remainingDistance * 100) / 100,
        });

        this.editManager.queueEdit({
          targetId: ball.id,
          targetType: TargetType.Balls,
          property: "y",
          editor: (y) =>
            y + Math.round(ball.dy * remainingDistance * 100) / 100,
        });
        break;
      }

      let collision: Collision = tmpCollision as Collision;
      const travelDistance = collision.distance;

      // Queue movement up to collision point
      this.editManager.queueEdit({
        targetId: ball.id,
        targetType: TargetType.Balls,
        property: "x",
        editor: (x) => x + Math.round(ball.dx * travelDistance * 100) / 100,
      });

      this.editManager.queueEdit({
        targetId: ball.id,
        targetType: TargetType.Balls,
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
          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "dx",
            editor: (_) => normalizedPaddleDx,
          });

          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "dy",
            editor: (_) => normalizedPaddleDy,
          });

          // Move the ball slightly outside the collision surface to prevent sticking
          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "x",
            editor: (x) => x + normalizedPaddleDx * EPSILON * 10,
          });

          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "y",
            editor: (y) => y + normalizedPaddleDy * EPSILON * 10,
          });

          remainingDistance -= EPSILON * 10;

          const playerId = collision.objectId;

          // Update lastHit through edit queue
          this.editManager.queueEdit({
            targetId: 0,
            targetType: TargetType.ExtraGameDataLastHit,
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
          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "dx",
            editor: (_) => normalizedWallDx,
          });

          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "dy",
            editor: (_) => normalizedWallDy,
          });

          // Move the ball slightly outside the collision surface to prevent sticking
          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "x",
            editor: (x) => x + normalizedWallDx * EPSILON * 10,
          });

          this.editManager.queueEdit({
            targetId: ball.id,
            targetType: TargetType.Balls,
            property: "y",
            editor: (y) => y + normalizedWallDy * EPSILON * 10,
          });

          remainingDistance -= EPSILON * 10;

          const wall: Rectangle = this.gameObjects.walls[collision.objectId];
          if (wall.isGoal) {
            const goalPlayerId = Math.floor(collision.objectId / 2);

            // Fix the bug in the original code (score + 1 was not being returned)
            this.editManager.queueEdit({
              targetId: goalPlayerId,
              targetType: TargetType.ExtraGameDataScores,
              property: "",
              editor: (score) => score + 1,
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
    this.editManager.processQueuedEdits();
  }

  // Getters & Setters
  getExtraGameData(): PongExtraGameData {
    return this.extraGameData;
  }

  getGameObjectsReadOnly(): Readonly<PongGameObjects> {
    return this.gameObjects as Readonly<PongGameObjects>;
  }

  getEditManager(): EditManager<TargetType> {
    return this.editManager;
  }
}
