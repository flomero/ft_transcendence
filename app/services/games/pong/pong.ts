import { GameBase, GameStatus } from "../gameBase";
import { PhysicsEngine, type Collision } from "../physicsEngine";
import {
  GAME_REGISTRY,
  GameModeCombinedSettings,
} from "../../../types/games/gameRegistry";
import type { Paddle } from "../../../types/games/pong/paddle";
import type { Ball } from "../../../types/games/pong/ball";
import type { Rectangle } from "../../../types/games/pong/rectangle";
import { UserInputManager } from "../userInputManager";
import { type UserInput } from "../../../types/games/userInput";

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
  results: number[];
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

  // User input manager
  protected inputManager: UserInputManager;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    // Registry settings
    this.serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    const serverMaxDelayS = GAME_REGISTRY.pong.serverMaxDelayS;
    this.serverMaxDelayTicks = serverMaxDelayS * this.serverTickrateS;

    // Network playability related
    this.tickData = new Array(this.serverMaxDelayTicks);

    // Players & related
    this.extraGameData = {
      playerCount: gameData.playerCount,
      lastHit: -1,
      scores: Array(gameData.playerCount).fill(0),
      results: Array(gameData.playerCount).fill(0),
    };

    // Game objects -> w/ collisions
    this.gameObjects = {
      balls: [],
      paddles: [],
      walls: [],
    };

    // Initialize UserInputManager
    this.inputManager = new UserInputManager();
  }

  startGame(): void {
    super.startGame();

    this.status = GameStatus.RUNNING;
    this.modifierManager.trigger("onGameStart");
  }

  async update(): Promise<void> {
    // Update game state
    if (this.status === GameStatus.RUNNING) {
      // Process any queued user inputs
      await this.processUserInputs();

      // Update paddle positions
      for (const paddle of this.gameObjects.paddles)
        if (paddle.velocity !== 0) this.updatePaddle(paddle);

      // Update ball positions
      for (const ball of this.gameObjects.balls)
        if (ball.doCollision) await this.doCollisionChecks(ball);

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

  protected updatePaddle(paddle: Paddle): void {
    if (!paddle.doMove) {
      console.log(
        `Player ${this.gameObjects.paddles.indexOf(paddle)}'s paddle can't be moved`,
      );
      return;
    }

    const direction = Math.sign(paddle.velocity); // -1, 0, or 1

    // Calculate new displacement as percentage (-50% to +50%)
    // paddle.velocity now represents percentage of width per tick
    let newDisplacement = paddle.displacement + paddle.velocity;

    // Calculate movement boundaries (e.g., ±35% if coverage is 30%)
    const maxDisplacementPercent = (100 - paddle.coverage) / 2.0;

    // Clamp the displacement within allowed range
    newDisplacement = Math.max(
      -maxDisplacementPercent,
      Math.min(maxDisplacementPercent, newDisplacement),
    );

    // Calculate actual change in displacement
    const deltaDisplacement = Math.abs(newDisplacement - paddle.displacement);

    // Update paddle position
    paddle.x +=
      direction * (deltaDisplacement / 100.0) * paddle.amplitude * paddle.dx;
    paddle.y +=
      direction * (deltaDisplacement / 100.0) * paddle.amplitude * paddle.dy;
    paddle.displacement = newDisplacement;

    // After updating, trigger the modifier
    const paddleIndex = this.gameObjects.paddles.indexOf(paddle);
    this.modifierManager.trigger("onPlayerMovement", {
      playerId: paddleIndex,
    });
  }

  // Process all queued user inputs
  async processUserInputs(): Promise<void> {
    const inputs = await this.inputManager.getAndClearInputs();
    if (inputs.length === 0) return;

    // Process each input with lag compensation
    for (const input of inputs) await this.processUserInput(input);
  }

  // Process a single user input with lag compensation
  async processUserInput(action: UserInput): Promise<void> {
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

    // Apply the input directly
    this.applyPlayerAction(action);

    // Trigger modifiers for user input
    this.modifierManager.trigger("onUserInput", { input: action });

    // Fast-forward back to current state
    if (delayTicks > 0) {
      console.log(`Fast-forwarding ${delayTicks} ticks`);
      await this.fastForward(delayTicks);
    }
  }

  // Apply a player action directly
  protected applyPlayerAction(action: UserInput): void {
    if (
      action.playerId < 0 ||
      action.playerId >= this.gameObjects.paddles.length
    ) {
      console.warn(`Invalid player ID: ${action.playerId}`);
      return;
    }

    const paddle = this.gameObjects.paddles[action.playerId];

    switch (action.type) {
      case "UP":
        paddle.velocity = paddle.speed;
        break;
      case "DOWN":
        paddle.velocity = -paddle.speed;
        break;
      case "STOP":
        paddle.velocity = 0.0;
        break;
    }
  }

  // Handle incoming user action
  async handleAction(action: Record<string, any>): Promise<void> {
    // Queue the action for processing in the next update
    await this.inputManager.queueInput(action as UserInput);
  }

  getStateSnapshot(): Record<string, any> {
    const gameState = super.getStateSnapshot();

    gameState.balls = this.gameObjects.balls.map((ball) => ({ ...ball }));
    gameState.paddles = this.gameObjects.paddles.map((paddle) => ({
      ...paddle,
    }));
    gameState.walls = this.gameObjects.walls.map((wall) => ({ ...wall }));
    gameState.scores = [...this.extraGameData.scores];
    gameState.lastHit = this.extraGameData.lastHit;
    gameState.rng = this.rng.getState();

    gameState.modifiersData = this.modifierManager.getStateSnapshot();

    return gameState;
  }

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.gameObjects.balls = snapshot.balls; //.map(ball => ({...ball}));
    this.gameObjects.paddles = snapshot.paddles; //.map(paddle => ({...paddle}));
    this.gameObjects.walls = snapshot.walls; //.map(wall => ({...wall}));
    this.extraGameData.scores = [...snapshot.scores];
    this.extraGameData.lastHit = snapshot.lastHit;

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
      // Simulate a tick without processing inputs
      await this.simulateTick();
    }
  }

  // Simulate a tick without processing inputs (for fast-forwarding)
  protected async simulateTick(): Promise<void> {
    // Update game state
    if (this.status === GameStatus.RUNNING) {
      // Update paddle positions
      for (const paddle of this.gameObjects.paddles) {
        if (paddle.velocity !== 0) this.updatePaddle(paddle);
      }

      // Update ball positions
      for (const ball of this.gameObjects.balls) {
        if (ball.doCollision) await this.doCollisionChecks(ball);
      }

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

  abstract isOutOfBounds(ball: Ball): boolean;
  abstract resetBall(ballId: number): void;

  async doCollisionChecks(ball: Ball): Promise<void> {
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
        ball.x += Math.round(ball.dx * remainingDistance * 100) / 100;
        ball.y += Math.round(ball.dy * remainingDistance * 100) / 100;
        break;
      }

      let collision: Collision = tmpCollision as Collision;
      const travelDistance = collision.distance;

      ball.x += Math.round(ball.dx * travelDistance * (100 - EPSILON)) / 100;
      ball.y += Math.round(ball.dy * travelDistance * (100 - EPSILON)) / 100;

      switch (collision.type) {
        case "powerUp":
          console.log(
            `\nPlayer ${this.extraGameData.lastHit} picked up a powerUp\n`,
          );

          this.modifierManager.pickupPowerUp(collision.objectId);
          break;

        case "paddle":
          PhysicsEngine.resolveCollision(ball, collision);
          const playerId = collision.objectId;

          if (this.extraGameData.lastHit !== playerId)
            console.log(`Last hit: ${playerId}`);
          this.extraGameData.lastHit = playerId;

          // Then trigger paddle bounce effects
          this.modifierManager.trigger("onPaddleBounce", {
            playerId: collision.objectId,
          });
          break;

        case "wall":
          PhysicsEngine.resolveCollision(ball, collision);

          const wall: Rectangle = this.gameObjects.walls[collision.objectId];
          if (wall.isGoal) {
            const goalPlayerId = Math.floor(collision.objectId / 2);
            this.extraGameData.scores[goalPlayerId]++;

            // Then trigger goal effects
            this.modifierManager.trigger("onGoal", {
              playerId: goalPlayerId,
            });
          } else this.modifierManager.trigger("onWallBounce");
          break;

        default:
          console.log(`Unknown collision type: ${collision.type}`);
      }

      remainingDistance -= travelDistance * (100 - EPSILON);

      loopCounter += 1;
      if (loopCounter > ball.speed * 3.0 + 1) {
        break;
      }
    }
  }

  // Getters
  getExtraGameData(): PongExtraGameData {
    return this.extraGameData;
  }

  getGameObjects(): PongGameObjects {
    return this.gameObjects;
  }

  abstract getSettings(): GameModeCombinedSettings;
}
