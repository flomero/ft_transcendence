import { GameBase } from "../gameBase";
import { GameStatus } from "../../../types/games/gameBaseState";
import { PhysicsEngine, type Collision } from "../physicsEngine";
import {
  GAME_REGISTRY,
  type GameModeCombinedSettings,
} from "../../../types/games/gameRegistry";
import type { Paddle } from "../../../types/games/pong/paddle";
import type { Ball } from "../../../types/games/pong/ball";
import type { Rectangle } from "../../../types/games/pong/rectangle";
import { UserInputManager } from "../userInputManager";
import type { UserInput } from "../../../types/games/userInput";
import { RNG } from "../rng";
import type { ExtendedCollisionData } from "../../../types/games/pong/extendedCollisionData";
import type {
  BallState,
  PaddleState,
  PongGameState,
  WallState,
} from "../../../types/games/pong/gameState";

const EPSILON = 1e-2;

export abstract class Pong extends GameBase {
  static readonly name = "pong";

  protected serverMaxDelayTicks: number;

  protected tickData: Record<string, any>[];
  protected tickDataLock: Promise<void> | null = null;

  protected gameState: PongGameState;

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

    // Initial gameState
    this.gameState = {
      startDate: this.gameBaseState.startDate,
      lastUpdate: this.gameBaseState.lastUpdate,
      status: this.gameBaseState.status,

      balls: [],
      paddles: [],
      walls: [],
      rng: new RNG(),
      lastHit: -1,
      lastGoal: -1,
      scores: Array(gameData.playerCount).fill(0),
      results: Array(gameData.playerCount).fill(0),
      eliminatedPlayers: [],
      playerCount: gameData.playerCount,
    };
    this.tickData.push(this.gameState);

    // Initialize UserInputManager
    this.inputManager = new UserInputManager();
  }

  startGame(): void {
    super.startGame();

    // this.gameBaseState.status = GameStatus.RUNNING;
    this.modifierManager.trigger("onGameStart");
  }

  async update(): Promise<void> {
    // Update game state
    if (this.gameBaseState.status === GameStatus.RUNNING) {
      // Process any queued user inputs
      await this.processUserInputs();

      // Update paddle positions
      this.gameState.paddles.forEach((paddle, index) => {
        this.modifierManager.trigger("onPaddleUpdate", {
          playerId: index,
        });
        paddle.velocity =
          (paddle.keyPressed["UP"] ? paddle.speed : 0) -
          (paddle.keyPressed["DOWN"] ? paddle.speed : 0);
        if (paddle.velocity !== 0) this.updatePaddle(paddle, true);
      });

      // Update ball positions
      for (const ball of this.gameState.balls)
        if (ball.doCollision)
          this.doCollisionChecks(this.gameState, ball, true);

      // Verify that no balls went out of bounds
      this.gameState.balls.forEach((ball, id) => {
        if (this.isOutOfBounds(ball)) {
          console.log(`Ball out of bounds --> resetting it`);
          this.resetBall(this.gameState, id, true);
        } else
          ball.speed = Math.max(this.getSettings().minBallSpeed, ball.speed);
        // this.modifierManager.trigger("onBallOutOfBounds", { ballID: id });
      });

      // Trigger modifiers
      this.modifierManager.trigger("onUpdate");
    }

    // Save the current state for potential rewinding
    // const snapshot = this.getStateSnapshot();
    this.saveStateSnapshot(this.gameState);
  }

  protected updatePaddle(paddle: Paddle, doTriggers: boolean): void {
    if (!paddle.doMove) {
      console.log(
        `Player ${this.gameState.paddles.indexOf(paddle)}'s paddle can't be moved`,
      );
      return;
    }

    const direction = Math.sign(paddle.velocity); // -1, 0, or 1

    // Calculate new displacement as percentage (-50% to +50%)
    // paddle.velocity now represents percentage of width per tick
    let newDisplacement = paddle.displacement + paddle.velocity;

    // Clamp the displacement within allowed range
    newDisplacement = Math.max(
      -paddle.maxDisplacement,
      Math.min(paddle.maxDisplacement, newDisplacement),
    );

    // Calculate actual change in displacement
    const deltaDisplacement = Math.abs(newDisplacement - paddle.displacement);

    // Update paddle position
    paddle.x +=
      direction * (deltaDisplacement / 100.0) * paddle.amplitude * paddle.dx;
    paddle.y +=
      direction * (deltaDisplacement / 100.0) * paddle.amplitude * paddle.dy;
    paddle.displacement = newDisplacement;

    this.gameState.balls.forEach((ball) => {
      const inObjectCollision = PhysicsEngine.resolveBallInsideObject(
        ball,
        paddle as Rectangle,
        this.gameState.paddles.indexOf(paddle),
        [direction * paddle.dx, direction * paddle.dy],
        false,
      );

      if (!inObjectCollision || !inObjectCollision.outOfBounds) return;

      ball.x = inObjectCollision.outOfBounds.position[0];
      ball.y = inObjectCollision.outOfBounds.position[1];
      PhysicsEngine.resolveCollision(ball, inObjectCollision);
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
      !(action.playerId >= 0 && action.playerId < this.gameState.playerCount)
    ) {
      console.log(
        `Can't handle player ${action.playerId}'s action: game has ${this.gameState.playerCount} players`,
      );
      return;
    }

    const delayS = (this.gameState.lastUpdate - action.timestamp) / 1000.0;
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
      await this.fastForward(delayTicks, this.gameState);
    }
  }

  // Apply a player action directly
  protected applyPlayerAction(action: UserInput): void {
    if (
      action.playerId < 0 ||
      action.playerId >= this.gameState.paddles.length
    ) {
      console.warn(`Invalid player ID: ${action.playerId}`);
      return;
    }

    const paddle = this.gameState.paddles[action.playerId];

    switch (action.type) {
      case "UP":
        paddle.keyPressed["UP"] = true;
        break;

      case "STOP_UP":
        paddle.keyPressed["UP"] = false;
        break;

      case "DOWN":
        paddle.keyPressed["DOWN"] = true;
        break;

      case "STOP_DOWN":
        paddle.keyPressed["DOWN"] = false;
        break;
    }
  }

  // Handle incoming user action
  async handleAction(action: Record<string, any>): Promise<void> {
    // Queue the action for processing in the next update
    await this.inputManager.queueInput(action as UserInput);
  }

  getStateSnapshot(): Record<string, any> {
    const gameBaseState = super.getStateSnapshot();

    const balls: BallState[] = this.gameState.balls
      .filter((ball) => ball.isVisible)
      .map((ball) => {
        return {
          r: parseFloat(ball.radius.toFixed(3)),
          x: parseFloat(ball.x.toFixed(3)),
          y: parseFloat(ball.y.toFixed(3)),
        };
      });

    const paddles: PaddleState[] = this.gameState.paddles
      .filter((paddle) => paddle.isVisible)
      .map((paddle) => {
        return {
          a: paddle.alpha,
          x: parseFloat(paddle.x.toFixed(3)),
          y: parseFloat(paddle.y.toFixed(3)),
          w: parseFloat(paddle.width.toFixed(3)),
          h: parseFloat(paddle.height.toFixed(3)),
        };
      });

    const walls: WallState[] = this.gameState.walls
      .filter((wall) => wall.isVisible)
      .map((wall) => {
        return {
          x: parseFloat(wall.x.toFixed(3)),
          y: parseFloat(wall.y.toFixed(3)),
          dx: parseFloat(wall.dx.toFixed(3)),
          dy: parseFloat(wall.dy.toFixed(3)),
          w: parseFloat(wall.width.toFixed(3)),
          h: parseFloat(wall.height.toFixed(3)),
          doRot: wall.doRotation,
        };
      });

    const snapshot = {
      // startDate: gameBaseState.startDate,
      // lastUpdate: gameBaseState.lastUpdate,
      // status: gameBaseState.status,
      modifiersState: gameBaseState.modifiersState,

      balls: balls, // this.gameState.balls,
      paddles: paddles, // this.gameState.paddles,
      walls: walls, // this.gameState.walls,

      // rng: this.gameState.rng.getState(),
      // lastHit: this.gameState.lastHit,
      // lastGoal: this.gameState.lastGoal,
      scores: this.gameState.scores,
      // results: this.gameState.results,
      // playerCount: this.gameState.playerCount,
    };

    return snapshot;
  }

  loadStateSnapshot(snapshot: Record<string, any>): void {
    this.gameState.balls = snapshot?.balls; //.map(ball => ({...ball}));
    this.gameState.paddles = snapshot?.paddles; //.map(paddle => ({...paddle}));
    this.gameState.walls = snapshot?.walls; //.map(wall => ({...wall}));
    this.gameState.scores = [...(snapshot?.scores || [])];
    this.gameState.lastHit = snapshot?.lastHit;

    this.modifierManager.loadStateSnapshot(snapshot?.modifiersData || {});

    if (snapshot?.rng) this.gameState.rng.setState(snapshot.rng);
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

  async fastForward(
    tickCount: number,
    gameState: PongGameState,
  ): Promise<void> {
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

    // Simulate the ticks without modifying the real game state
    for (let i = 0; i < tickCount; i++) this.simulateTick(gameState, true);
  }

  // Simulate a tick using a given game state
  protected simulateTick(gameState: PongGameState, doTriggers: boolean): void {
    // Update paddle positions
    for (const paddle of gameState.paddles)
      if (paddle.velocity !== 0) this.updatePaddle(paddle, doTriggers);

    // Update ball positions
    for (const ball of gameState.balls)
      if (ball.doCollision) this.doCollisionChecks(gameState, ball, doTriggers);

    // Verify that no balls went out of bounds
    // gameState.balls.forEach((ball, id) => {
    //   if (this.isOutOfBounds(ball)) this.resetBall(gameState, id, doTriggers);
    // });

    // Trigger modifiers
    if (doTriggers) this.modifierManager.trigger("onUpdate");
  }

  abstract isOutOfBounds(ball: Ball): boolean;
  abstract resetBall(
    gameState: PongGameState,
    ballId: number,
    doTriggers: boolean,
  ): void;

  protected doCollisionChecks(
    gameState: PongGameState,
    ball: Ball,
    doTriggers: boolean,
  ): void {
    const getClosestCollision = (
      collisions: Array<Collision | null>,
    ): Collision | null => {
      // Priority 1: Out-of-bounds collisions
      for (let k = 0; k < collisions.length; k++) {
        if (collisions[k]?.outOfBounds) return collisions[k];
      }

      // Priority 2: Normal collisions by distance
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
        gameState.paddles,
        "paddle",
      );
      const wallCollision: Collision | null = PhysicsEngine.detectCollision(
        ball,
        remainingDistance,
        gameState.walls,
        "wall",
      );
      const powerUpCollision: Collision | null = PhysicsEngine.detectCollision(
        ball,
        remainingDistance,
        this.modifierManager.getSpawnedPowerUsObjects(),
        "powerUp",
      );

      const tmpCollision: Collision | null = getClosestCollision([
        paddleCollision,
        wallCollision,
        powerUpCollision,
      ]);

      if (!tmpCollision) {
        ball.x +=
          Math.round(ball.dx * remainingDistance * (100 - EPSILON)) / 100;
        ball.y +=
          Math.round(ball.dy * remainingDistance * (100 - EPSILON)) / 100;
        break;
      }

      const collision: Collision = tmpCollision;

      // Handle out-of-bounds case
      if (collision.outOfBounds && collision.normal) {
        if (
          collision.type === "wall" &&
          this.gameState.walls[collision.objectId].isGoal &&
          doTriggers
        ) {
          this.resolveWallCollision(ball, collision.objectId, doTriggers);
          break;
        }

        // Move the ball directly to the resolved collision position
        const [newX, newY] = collision.outOfBounds.position;
        ball.x = newX;
        ball.y = newY;

        // Reflect direction and slightly nudge ball out to avoid sticking
        PhysicsEngine.resolveCollision(ball, collision);

        // Don't reduce remainingDistance since this is a corrective step
        continue;
      }

      const travelDistance = collision.distance;
      ball.x +=
        Math.round(ball.dx * travelDistance * (100 - 2 * EPSILON)) / 100;
      ball.y +=
        Math.round(ball.dy * travelDistance * (100 - 2 * EPSILON)) / 100;

      switch (collision.type) {
        case "powerUp":
          console.log(`\nPlayer ${gameState.lastHit} picked up a powerUp`);
          this.modifierManager.pickupPowerUp(collision.objectId);
          break;

        case "paddle":
          PhysicsEngine.resolveCollision(ball, collision);

          const playerId = collision.objectId;
          // if (gameState.lastHit !== playerId)
          //   console.log(`Last hit: ${playerId}`);
          gameState.lastHit = playerId;

          const paddle = this.gameState.paddles[playerId];

          // Compute the dot product between the ball's direction and the paddle's movement direction.
          // A high |dot| means the ball is moving almost aligned with the paddle's direction.
          const dot = ball.dx * paddle.dx + ball.dy * paddle.dy;

          // Multiply by |dot| so that the influence is higher when the ball is aligned with the paddle's direction.
          const angularInfluence =
            (dot *
              this.getSettings().paddleVelocityAngularTransmissionPercent) /
            100.0;

          // Adjust the ball's velocity using the paddle's velocity.
          ball.dx += angularInfluence * paddle.dx;
          ball.dy += angularInfluence * paddle.dy;

          const speedInfluence =
            (dot * this.getSettings().paddleVelocitySpeedTransmissionPercent) /
            100.0;
          ball.speed += speedInfluence * paddle.velocity;

          // Normalize the ball's direction vector to avoid unintended scaling.
          const norm = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          ball.dx /= norm;
          ball.dy /= norm;

          this.modifierManager.trigger("onPaddleBounce", {
            ballId: this.gameState.balls.indexOf(ball),
            playerId: collision.objectId,
          });
          break;

        case "wall":
          PhysicsEngine.resolveCollision(ball, collision);
          this.resolveWallCollision(ball, collision.objectId, doTriggers);
          break;

        default:
          console.log(`Unknown collision type: ${collision.type}`);
      }

      remainingDistance -= travelDistance * (100 - 2 * EPSILON);
      loopCounter += 1;
      if (loopCounter > ball.speed * 3.0 + 1) {
        break;
      }
    }
  }

  protected resolveWallCollision(
    ball: Ball,
    wallID: number,
    doTriggers: boolean,
  ) {
    const wall: Rectangle = this.gameState.walls[wallID];
    if (wall.isGoal && ball.doGoal) {
      const goalPlayerId = Math.floor(wallID / 2);
      this.gameState.scores[goalPlayerId]++;
      this.gameState.lastGoal = goalPlayerId;
      if (doTriggers)
        this.modifierManager.trigger("onGoal", {
          playerId: goalPlayerId,
        });
    } else {
      if (doTriggers)
        this.modifierManager.trigger("onWallBounce", {
          wallID: wallID,
        });
    }
  }

  /**
   * Predicts the next collision between the ball and a target object (paddle or wall)
   * given an initial game state, simulating forward for up to maxTicks.
   *
   * @param initialState - The starting snapshot of your game state.
   * @param maxTicks - Maximum number of ticks to simulate.
   * @param targetId - The ID of the target game object (index in its array).
   * @param targetCategory - The type of target, either "paddle" or "wall".
   * @returns An object with the tick number and collision details, or null if none is found.
   */
  findNextCollisions(
    gameState: PongGameState,
    maxTicks: number,
    targetId: number,
    targetCategory: "paddle" | "wall",
  ): ExtendedCollisionData[] {
    const collisionsData = [];
    for (let tick = 1; tick <= maxTicks; tick++) {
      // Retrieve the ball
      const ball = gameState.balls[0];
      // Use the ball's speed as the per-tick movement distance.
      const tickDelta = ball.speed;

      // Retrieve the target object based on its category.
      let target: any;
      if (targetCategory === "paddle") {
        target = gameState.paddles[targetId];
      } else if (targetCategory === "wall") {
        target = gameState.walls[targetId];
      }

      // Use the PhysicsEngine to detect a collision.
      const collision = PhysicsEngine.detectCollision(
        ball,
        tickDelta,
        [target],
        targetCategory,
      );

      // If a collision is detected, return the tick number and details.
      if (collision !== null) {
        const ballPosOnCollision = {
          x: ball.x + ball.dx * collision.distance,
          y: ball.y + ball.dy * collision.distance,
        };
        collisionsData.push({
          tick: tick,
          collisionPos: ballPosOnCollision,
          collision: collision,
        });
      }

      // Simulate one tick forward w/o triggering modifiers
      this.simulateTick(gameState, false);
    }
    return collisionsData;
  }

  getRNG(): RNG {
    return this.gameState.rng;
  }

  getState(): PongGameState {
    return this.gameState;
  }

  abstract getSettings(): GameModeCombinedSettings;

  isEliminated(playerID: number): boolean {
    if (playerID < 0 || playerID >= this.gameState.playerCount) return true;
    return this.gameState.eliminatedPlayers.includes(playerID);
  }

  eliminate(playerID: number): void {
    this.modifierManager.trigger("onPlayerElimination", { playerId: playerID });
  }
}
