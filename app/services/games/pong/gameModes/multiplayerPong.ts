import { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import type { Ball } from "../../../../types/games/pong/ball";
import type { Paddle } from "../../../../types/games/pong/paddle";
import {
  GAME_REGISTRY,
  type GameModeCombinedSettings,
} from "../../../../types/games/gameRegistry";
import { StrategyManager } from "../../../strategy/strategyManager";
import type { IPongBallResetSampler } from "../../../../types/strategy/IPongBallResetSampler";
import { pongUserInputs } from "../../../../types/games/userInput";

export class MultiplayerPong extends Pong {
  name = "multiplayerPong";

  protected settings: GameModeCombinedSettings;

  private ballResetSampler: StrategyManager<
    IPongBallResetSampler,
    "sampleDirection"
  >;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    const customConfig = gameData.gameModeConfig || {};
    const registry = GAME_REGISTRY.pong.gameModes[this.name];
    this.settings = {
      // Fixed settings
      arenaWidth: registry.fixedSettings.arenaWidth,
      arenaHeight: registry.fixedSettings.arenaHeight,
      paddleOffset: registry.fixedSettings.paddleOffset,
      paddleHeight: registry.fixedSettings.paddleHeight,
      wallsHeight: registry.fixedSettings.wallsHeight,
      wallsOffset: registry.fixedSettings.wallsOffset,

      // Customizable settings
      ballSpeedWidthPercentS:
        customConfig.ballSpeedWidthPercentS ||
        registry.customizableSettings.ballSpeedWidthPercentS,
      ballRadius:
        customConfig.ballRadius || registry.customizableSettings.ballRadius,
      ballResetSampler:
        customConfig.ballResetSampler ||
        registry.customizableSettings.ballResetSampler,
      paddleCoveragePercent:
        customConfig.paddleCoveragePercent ||
        registry.customizableSettings.paddleCoveragePercent,
      paddleSpeedWidthPercentS:
        customConfig.paddleSpeedWidthPercentS ||
        registry.customizableSettings.paddleSpeedWidthPercentS,
      paddleVelocityAngularTransmissionPercent:
        customConfig.paddleVelocityAngularTransmissionPercent ||
        registry.customizableSettings.paddleVelocityAngularTransmissionPercent,
      paddleVelocitySpeedTransmissionPercent:
        customConfig.paddleVelocitySpeedTransmissionPercent ||
        registry.customizableSettings.paddleVelocitySpeedTransmissionPercent,
      powerUpRadius:
        customConfig.powerUpRadius ||
        registry.customizableSettings.powerUpRadius,
      powerUpCapacities: registry.customizableSettings.powerUpCapacities,
    };

    this.settings.ballSpeed =
      (this.settings.arenaWidth *
        (this.settings.ballSpeedWidthPercentS / 100)) /
      this.serverTickrateS;
    this.settings.arenaRadius = this.settings.arenaWidth / 2.0;

    if (customConfig.powerUpCapacities)
      for (const [key, value] of Object.entries(
        customConfig.powerUpCapacities as Record<string, number>,
      ))
        this.settings.powerUpCapacities[key] = value;

    console.log("Loaded settings:");
    console.dir(this.settings, { depth: null });

    this.ballResetSampler = new StrategyManager(
      this.settings.ballResetSampler,
      "pongBallResetSampler",
      "sampleDirection",
    );

    this.initPaddles();
    this.initWalls();
    this.resetBall(this.gameState, -1, true);
  }

  startGame(): void {
    console.log("Starting Game");
    super.startGame();
    console.log("Game Started");

    console.log(`Balls: ${this.gameState.balls.length}`);
    console.log(`Paddles: ${this.gameState.paddles.length}`);
    console.log(`Walls: ${this.gameState.walls.length}`);
  }

  initPaddles(): void {
    // Calculate paddleAmplitude - the maximum possible distance the paddle can travel
    const paddleAmplitude =
      (this.settings.arenaRadius - this.settings.paddleOffset) *
      Math.sin(Math.PI / this.gameState.playerCount);

    // Calculate the coverage percentage (0 to 1)
    const coverage = this.settings.paddleCoveragePercent / 100.0;
    const maxDisplacement = (100 - this.settings.paddleCoveragePercent) / 2.0;

    // Calculate actual paddle width based on amplitude and coverage
    const paddleWidth = paddleAmplitude * coverage;

    // paddleSpeed is percentage of width per second (independent of tickrate)
    const paddleSpeedPercent = this.settings.paddleSpeedWidthPercentS / 100.0;

    for (let index = 0; index < this.gameState.playerCount; ++index) {
      const angle =
        Math.PI + (Math.PI * 2 * index) / this.gameState.playerCount;
      const radius = this.settings.arenaRadius - this.settings.paddleOffset;

      let paddle: Paddle = {
        id: index,
        x: parseFloat((radius * Math.cos(angle)).toFixed(3)),
        y: parseFloat((radius * Math.sin(angle)).toFixed(3)),
        alpha: parseFloat(angle.toFixed(3)),
        coverage: this.settings.paddleCoveragePercent,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.settings.paddleHeight,
        speed: paddleSpeedPercent,
        doMove: true,
        isVisible: true,
        velocity: 0.0,
        displacement: 0.0,
        absX: 0,
        absY: 0,
        nx: 0,
        ny: 0,
        dx: 0,
        dy: 0,
        doCollision: true,
        doRotation: true,
        maxDisplacement: maxDisplacement,
        keyPressed: {
          ...Object.fromEntries(
            Object.keys(pongUserInputs).map((key) => [key, false]),
          ),
        },
      };

      const tmp: number = Math.sqrt(paddle.x ** 2 + paddle.y ** 2);
      if (tmp !== 0) {
        paddle.nx = -paddle.x / tmp;
        paddle.ny = -paddle.y / tmp;
      }

      paddle.x += this.settings.arenaRadius;
      paddle.y += this.settings.arenaRadius;

      paddle.dx = paddle.ny;
      paddle.dy = -paddle.nx;

      paddle.absX = paddle.x;
      paddle.absY = paddle.y;

      this.gameState.paddles.push(paddle);
    }
  }

  initWalls(): void {
    // Initialize walls, rotate by alpha
    const wallWidth =
      2.0 *
      this.settings.arenaRadius *
      Math.sin(Math.PI / (2.0 * this.gameState.playerCount));

    for (let index = 0; index < 2 * this.gameState.playerCount; index++) {
      const wall: Rectangle = {
        id: index,
        x: parseFloat(
          (
            (this.settings.arenaRadius -
              this.settings.wallsOffset * (index % 2)) *
            Math.cos((Math.PI * index) / this.gameState.playerCount + Math.PI)
          ).toFixed(3),
        ),
        y: parseFloat(
          (
            (this.settings.arenaRadius -
              this.settings.wallsOffset * (index % 2)) *
            Math.sin((Math.PI * index) / this.gameState.playerCount + Math.PI)
          ).toFixed(3),
        ),
        alpha: parseFloat(
          (Math.PI + (Math.PI * index) / this.gameState.playerCount).toFixed(3),
        ),
        width: wallWidth,
        height: this.settings.wallsHeight,
        isVisible: true, //index % 2 == 1,
        absX: 0,
        absY: 0,
        nx: 0,
        ny: 0,
        dx: 0,
        dy: 0,
        isGoal: index % 2 == 0,
        doCollision: true,
        doRotation: true,
      };

      const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

      if (tmp !== 0) {
        wall.nx = -wall.x / tmp;
        wall.ny = -wall.y / tmp;
      }

      wall.absX = wall.x;
      wall.absY = wall.y;
      wall.x += this.settings.arenaRadius;
      wall.y += this.settings.arenaRadius;

      wall.dx = wall.ny;
      wall.dy = -wall.nx;

      this.gameState.walls.push(wall);
    }

    // Calculate proper widths for walls to ensure they overlap correctly
    const totalWalls = this.gameState.walls.length;

    // First compute all new widths without modifying the walls
    for (let i = 0; i < totalWalls; i += 2) {
      const currentWall = this.gameState.walls[i];

      // Get the wall before and after (odd-indexed walls that remain fixed)
      const prevWallIndex = (i - 1 + totalWalls) % totalWalls;
      const nextWallIndex = (i + 1) % totalWalls;

      const prevWall = this.gameState.walls[prevWallIndex];
      const nextWall = this.gameState.walls[nextWallIndex];

      // Get the corners of the fixed odd walls that we need to connect to
      // For prevWall, we need its bottom-right corner (+direction, -normal)
      const prevWallCorner = {
        x:
          prevWall.x +
          (prevWall.dx * prevWall.width) / 2 -
          (prevWall.nx * prevWall.height) / 2,
        y:
          prevWall.y +
          (prevWall.dy * prevWall.width) / 2 -
          (prevWall.ny * prevWall.height) / 2,
      };

      // For nextWall, we need its bottom-left corner (-direction, -normal)
      const nextWallCorner = {
        x:
          nextWall.x -
          (nextWall.dx * nextWall.width) / 2 -
          (nextWall.nx * nextWall.height) / 2,
        y:
          nextWall.y -
          (nextWall.dy * nextWall.width) / 2 -
          (nextWall.ny * nextWall.height) / 2,
      };

      // Calculate the vector between the corners
      let dx = nextWallCorner.x - prevWallCorner.x;
      let dy = nextWallCorner.y - prevWallCorner.y;
      const width = Math.sqrt(dx ** 2 + dy ** 2) || currentWall.width;

      currentWall.width = width;
    }
  }

  resetBall(
    gameState: Record<string, any>,
    ballId: number = -1,
    doTriggers: boolean,
  ): void {
    const sampledDirection = this.ballResetSampler.executeStrategy(this);

    const ca = Math.cos(sampledDirection.angularDirection);
    const sa = Math.sin(sampledDirection.angularDirection);

    const x = this.settings.arenaWidth / 2.0 + sampledDirection.magnitude * ca;
    const y = this.settings.arenaHeight / 2.0 + sampledDirection.magnitude * sa;

    if (ballId < 0) {
      // Reset all balls
      gameState.balls = [
        {
          id: 0,
          x: x,
          y: y,
          dx: ca,
          dy: sa,
          speed: this.settings.ballSpeed,
          radius: this.settings.ballRadius,
          isVisible: true,
          doCollision: true,
          doGoal: true,
        },
      ];
    } else {
      // Find the ball by ID and update it
      gameState.balls[ballId] = {
        id: ballId,
        x: x,
        y: y,
        dx: ca,
        dy: sa,
        speed: this.settings.ballSpeed,
        radius: this.settings.ballRadius,
        isVisible: true,
        doCollision: true,
        doGoal: true,
      };
    }

    if (doTriggers) this.modifierManager.trigger("onBallReset");
  }

  rotatePaddles(alpha: number = 0.0): void {
    const paddleAmplitude =
      (this.settings.arenaRadius - this.settings.paddleOffset) *
      Math.sin(Math.PI / this.gameState.playerCount);

    for (let idx = 0; idx < this.gameState.paddles.length; idx++) {
      const paddle = this.gameState.paddles[idx];
      const baseAngle =
        Math.PI + (2 * Math.PI * idx) / this.gameState.playerCount;

      // Apply rotation offset
      const newAngle = baseAngle + alpha;

      // Compute base position
      const baseX =
        (this.settings.arenaRadius - this.settings.paddleOffset) *
        Math.cos(newAngle);
      const baseY =
        (this.settings.arenaRadius - this.settings.paddleOffset) *
        Math.sin(newAngle);

      // Compute normal vector
      const norm = Math.hypot(baseX, baseY);
      if (norm !== 0) {
        paddle.nx = -baseX / norm;
        paddle.ny = -baseY / norm;
      }

      // Set lateral movement direction
      paddle.dx = paddle.ny;
      paddle.dy = -paddle.nx;

      // Update position with displacement
      const finalX = baseX + paddle.displacement * paddle.dx * paddle.speed;
      const finalY = baseY + paddle.displacement * paddle.dy * paddle.speed;

      // Adjust for arena offset
      paddle.x = parseFloat((finalX + this.settings.arenaRadius).toFixed(3));
      paddle.y = parseFloat((finalY + this.settings.arenaRadius).toFixed(3));

      // Update angle
      paddle.alpha = parseFloat(newAngle.toFixed(3));

      // Update width and speed
      paddle.width = parseFloat(
        (
          paddleAmplitude *
          (this.settings.paddleCoveragePercent / 100.0)
        ).toFixed(3),
      );
    }
  }

  rotateWalls(alpha: number = 0.0): void {
    const centerX = this.settings.arenaRadius;
    const centerY = this.settings.arenaRadius;
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);

    for (let id = 0; id < this.gameState.walls.length; id++) {
      // Skip the center wall and extra walls
      if (id >= 2 * this.gameState.playerCount) {
        continue;
      }

      const wall = this.gameState.walls[id];

      // Get base position
      const baseX = wall.absX;
      const baseY = wall.absY;

      // Rotate base position
      const rotatedX = baseX * cosA - baseY * sinA;
      const rotatedY = baseX * sinA + baseY * cosA;

      // Update wall position
      wall.x = parseFloat((rotatedX + centerX).toFixed(3));
      wall.y = parseFloat((rotatedY + centerY).toFixed(3));

      // Update wall orientation
      const newAngle = Math.atan2(rotatedY, rotatedX);
      wall.alpha = parseFloat(newAngle.toFixed(3));

      // Recalculate normal vector
      const norm = Math.hypot(rotatedX, rotatedY);
      if (norm !== 0) {
        wall.nx = -rotatedX / norm;
        wall.ny = -rotatedY / norm;
      }

      // Update lateral vector
      wall.dx = wall.ny;
      wall.dy = -wall.nx;
    }
  }

  // Implementation of isOutOfBounds method
  isOutOfBounds(ball: Ball): boolean {
    const tolerance: number =
      this.settings.wallsHeight +
      this.settings.wallOffset +
      this.settings.paddleOffset;

    const distance =
      (ball.x - this.settings.arenaRadius) ** 2 +
      (ball.y - this.settings.arenaRadius) ** 2;
    return (
      distance >= tolerance + this.settings.arenaRadius ** 2 + ball.radius ** 2
    );
  }

  getResults(): number[] {
    return this.gameState.results;
  }

  getSettings(): GameModeCombinedSettings {
    return this.settings;
  }

  public getScores(): number[] {
    return this.gameState.scores;
  }
}
