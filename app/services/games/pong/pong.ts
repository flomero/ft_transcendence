import { GameBase, GameStatus } from "../gameBase";
import { PhysicsEngine, Collision } from "../physicsEngine";
import { GAME_REGISTRY } from "../gameRegistry";
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

export abstract class Pong extends GameBase {
  static readonly name = "pong";

  protected serverMaxDelayTicks: number;

  protected tickData: Record<string, any>[];
  protected tickDataLock: Promise<void> | null = null;

  protected extraGameData: PongExtraGameData;

  protected gameObjects: PongGameObjects;
  protected gameObjectsLock: Promise<void> | null = null;

  protected arenaSettings: Record<string, any>;

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

  async update(): Promise<void> {
    if (this.status === GameStatus.RUNNING) {
      // Use a lock for game objects
      if (this.gameObjectsLock === null)
        this.gameObjectsLock = Promise.resolve();

      await this.gameObjectsLock.then(async () => {
        this.gameObjectsLock = new Promise<void>((resolve) => {
          for (const paddle of this.gameObjects.paddles)
            if (paddle.velocity !== 0.0) this.updatePaddle(paddle);
          resolve();
        });
      });

      for (const ball of this.gameObjects.balls) {
        if (ball.doCollision) this.doCollisionChecks(ball);

        if (this.isOutOfBounds(ball)) {
          console.log("Ball went out of bounds, resetting it");
          this.resetBall(0);
        }
      }
      this.modifierManager.trigger(this, "onUpdate");

      const snapshot = this.getStateSnapshot();

      // Use a lock for tick data
      if (this.tickDataLock === null) this.tickDataLock = Promise.resolve();

      await this.tickDataLock.then(async () => {
        this.tickDataLock = new Promise<void>((resolve) => {
          this.lastUpdateTime = Date.now();
          this.tickData.push(snapshot);
          if (this.tickData.length > this.serverMaxDelayTicks)
            this.tickData.shift();
          resolve();
        });
      });
    }
  }

  simulateTick(): void {
    if (this.status === GameStatus.RUNNING) {
      for (const ball of this.gameObjects.balls)
        if (ball.doCollision) this.doCollisionChecks(ball);
      this.modifierManager.trigger(this, "onUpdate");
    }
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

    const delayMs = this.lastUpdateTime - action.timestamp;
    const delayTicks = Math.round(delayMs / this.serverTickrateS);

    if (delayTicks > this.serverMaxDelayTicks) {
      console.log(
        `Player ${action.playerId} has really high ping -> disconnecting`,
      );
      // TODO: Disconnection in case of high ping
      return;
    }

    // Rewind game state delay_ticks
    if (delayTicks > 0) {
      console.log(`Rewinding ${delayTicks} ticks`);
      await this.rewind(delayTicks);
    }

    // Apply user_input
    if (this.gameObjectsLock === null) this.gameObjectsLock = Promise.resolve();

    await this.gameObjectsLock.then(async () => {
      this.gameObjectsLock = new Promise<void>((resolve) => {
        switch (action.type) {
          case "UP":
            this.gameObjects.paddles[action.playerId].velocity =
              this.gameObjects.paddles[action.playerId].speed;
            break;

          case "DOWN":
            this.gameObjects.paddles[action.playerId].velocity =
              -this.gameObjects.paddles[action.playerId].speed;
            break;

          case "STOP":
            this.gameObjects.paddles[action.playerId].velocity = 0.0;
            break;
        }
        resolve();
      });
    });

    this.modifierManager.trigger(this, "onUserInput", { input: action });

    // Fast-forward to go back to the current tick
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

    return gameState;
  }

  // TODO: Use gameState schema
  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.gameObjects.balls = snapshot.balls;
    this.gameObjects.walls = snapshot.walls;
    this.gameObjects.paddles = snapshot.player_paddles;
    this.extraGameData.scores = snapshot.scores;

    this.rng.setState(snapshot.rng);
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

    // Now, re-simulate the ticks one by one
    for (let i = 0; i < tickCount; i++) {
      this.simulateTick();
      const snapshot = this.getStateSnapshot();

      await this.tickDataLock.then(async () => {
        this.tickDataLock = new Promise<void>((resolve) => {
          this.tickData.push(snapshot);
          resolve();
        });
      });
    }
  }

  updatePaddle(paddle: Paddle): void {
    if (!paddle.doMove) {
      console.log(
        `Player ${this.gameObjects.paddles.indexOf(paddle)}'s paddle can't be moved`,
      );
      return;
    }

    const direction = paddle.velocity > 0 ? 1 : -1;

    if (
      (direction > 0 &&
        paddle.displacement >
          this.arenaSettings.height / 2.0 - paddle.coverage / 2.0) ||
      (direction < 0 &&
        paddle.displacement <
          -(this.arenaSettings.height / 2.0 - paddle.coverage / 2.0))
    ) {
      console.log(`Can't move in this direction anymore`);
      return;
    }

    paddle.x += paddle.velocity * paddle.dx;
    paddle.y += paddle.velocity * paddle.dy;
    paddle.displacement +=
      direction * this.arenaSettings.paddleSpeedWidthPercent;

    this.modifierManager.trigger(this, "onPlayerMovement", {
      playerId: this.gameObjects.paddles.indexOf(paddle),
    });
  }

  resetBall(ballId: number = -1): void {
    const randomAngle = this.rng.random() * Math.PI * 2.0;
    const ca = Math.cos(randomAngle);
    const sa = Math.sin(randomAngle);

    // Reset all balls
    this.gameObjects.balls[0] = {
      x: 50 + 2.0 * ca,
      y: 50 + 2.0 * sa,
      dx: ca,
      dy: sa,
      speed: 2,
      radius: 0.75,
      isVisible: true,
      doCollision: true,
      doGoal: true,
    };
  }

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

      let powerUpCollision: Collision | null = null;
      if (this.modifierManager.getSpawnedPowerUps().length > 0) {
        powerUpCollision = PhysicsEngine.detectCollision(
          ball,
          remainingDistance,
          this.modifierManager.getSpawnedPowerUps(),
          "powerUp",
        );
      }

      // Balls that can't score a goal can't pickup powerUps
      if (!ball.doGoal) powerUpCollision = null;

      // Determine the closest collision
      const tmpCollision: Collision | null = getClosestCollision([
        paddleCollision,
        wallCollision,
        powerUpCollision,
      ]);

      if (!tmpCollision) {
        // Move ball normally if no collision
        ball.x += Math.round(ball.dx * remainingDistance * 100) / 100;
        ball.y += Math.round(ball.dy * remainingDistance * 100) / 100;
        break;
      }

      let collision: Collision = tmpCollision as Collision;

      const travelDistance = collision.distance;
      ball.x += Math.round(ball.dx * travelDistance * 100) / 100;
      ball.y += Math.round(ball.dy * travelDistance * 100) / 100;

      switch (collision.type) {
        case "powerUp":
          // TODO: trigger onPowerUpPickup
          PhysicsEngine.resolveCollision(ball, collision);
          console.log(
            `Player ${this.extraGameData.lastHit} picked up a powerUp`,
          );
          break;

        case "paddle":
          PhysicsEngine.resolveCollision(ball, collision);
          const playerId = collision.objectId;

          // Update lastHit
          this.extraGameData.lastHit = playerId;
          console.log(`Last hit: ${this.extraGameData.lastHit}`);

          // Then trigger on paddle bounce effects
          this.modifierManager.trigger(this, "onPaddleBounce", {
            playerId: collision.objectId,
          });
          break;

        case "wall":
          PhysicsEngine.resolveCollision(ball, collision);
          // TODO: Bounce or Goal ?
          const wall: Rectangle = this.gameObjects.walls[collision.objectId];
          if (wall.isGoal) {
            const playerId = Math.floor(collision.objectId / 2);

            // Update the scores
            this.extraGameData.scores[playerId]++;

            // Then trigger on goal effects
            this.modifierManager.trigger(this, "onGoal", {
              playerId: playerId,
            });
          } else this.modifierManager.trigger(this, "onWallBounce");
          break;

        default:
          console.log(`Unknown collision type: ${collision.type}`);
      }
      // if (collision.type !== "powerUp") {
      //   PhysicsEngine.resolveCollision(ball, collision);

      //   // Handle modifiers
      //   if (collision.type === "paddle") {
      //     this.modifierManager.trigger(this, "onPaddleBounce", {
      //       playerId: collision.objectId,
      //     });
      //   } else if (collision.type === "wall") {
      //     console.log(this.gameObjects.walls[collision.objectId]);
      //     if (ball.doGoal
      //       && this.gameObjects.walls[collision.objectId].isGoal)
      //       this.modifierManager.trigger(this, "onGoal", {
      //         playerId: Math.floor(collision.objectId / 2),
      //       });
      //     else this.modifierManager.trigger(this, "onWallBounce");
      //   }
      // } else {
      //   console.log(
      //     `Player ${this.extraGameData.lastHit} picked up a powerUp`,
      //   );
      //   this.modifierManager.trigger(this, "onPowerUpPickup", {
      //     powerUp:
      //       (this.powerUpManager as PowerUpManagerBase).getSpawnedPowerUps()[collision.objectId],
      //     playerId: this.extraGameData.lastHit,
      //   });
      //   (this.powerUpManager as PowerUpManagerBase).getSpawnedPowerUps().splice(collision.objectId, 1);
      // }

      remainingDistance -= travelDistance;

      loopCounter += 1;
      if (loopCounter > ball.speed * 3.0 + 1) {
        break;
      }
    }
  }

  // Getters & Setters
  getExtraGameData(): PongExtraGameData {
    return this.extraGameData;
  }

  editScore(id: number, delta: number) {
    this.extraGameData.scores[id] += delta;
  }

  setLastHit(id: number) {
    this.extraGameData.lastHit = id;

    console.log(`New lastHit: ${this.extraGameData.lastHit}`);
  }
}
