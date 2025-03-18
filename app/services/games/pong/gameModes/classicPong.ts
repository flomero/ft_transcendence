import { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import type { Ball } from "../../../../types/games/pong/ball";
import type { Paddle } from "../../../../types/games/pong/paddle";
import {
  type BallSettings,
  GAME_REGISTRY,
} from "../../../../types/games/gameRegistry";

export class ClassicPong extends Pong {
  name = "classicPong";

  protected defaultBallSettings: BallSettings;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    const defaultBallSettingsS: Record<string, any> =
      GAME_REGISTRY.pong.gameModes[this.name].defaultBallSettings;

    this.defaultBallSettings = {
      speed:
        (this.arenaSettings.width *
          (defaultBallSettingsS.speedWidthPercentS / 100.0)) /
        this.serverTickrateS,
      radius: defaultBallSettingsS.radius,
    };

    this.resetBall();
    this.initPaddles();
    this.initWalls();
  }

  startGame(): void {
    console.log("Starting Game");
    super.startGame();
    console.log("Game Started");

    console.log(`Balls: ${this.gameObjects.balls.length}`);
    console.log(`Paddles: ${this.gameObjects.paddles.length}`);
    console.log(`Walls: ${this.gameObjects.walls.length}`);
  }

  initPaddles(): void {
    const paddleAmplitude =
      this.arenaSettings.height - this.arenaSettings.wallHeight;

    // Calculate the coverage percentage (0 to 1)
    const coverage = this.arenaSettings.paddleCoverage / 100.0;

    // Calculate actual paddle width based on amplitude and coverage
    const paddleWidth = paddleAmplitude * coverage;

    // paddleSpeed is percentage of width per second (independent of tickrate)
    const paddleSpeedPercent =
      this.arenaSettings.paddleSpeedWidthPercentS / 100.0;

    this.gameObjects.paddles = [
      // LEFT PADDLE
      {
        doCollision: true,
        id: 0,
        x:
          this.arenaSettings.paddleHeight / 2.0 +
          this.arenaSettings.paddleOffset,
        y: this.arenaSettings.height / 2.0,
        alpha: Math.PI,
        dx: 0.0,
        dy: -1.0,
        nx: 1.0,
        ny: 0.0,
        absX:
          this.arenaSettings.paddleHeight / 2.0 +
          this.arenaSettings.paddleOffset,
        absY: this.arenaSettings.height / 2.0,
        coverage: this.arenaSettings.paddleCoverage,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.arenaSettings.paddleHeight,
        speed: paddleSpeedPercent,
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
      } as Paddle,

      // RIGHT PADDLE
      {
        doCollision: true,
        id: 1,
        x:
          this.arenaSettings.width -
          this.arenaSettings.paddleHeight / 2.0 -
          this.arenaSettings.paddleOffset,
        y: this.arenaSettings.height / 2.0,
        alpha: 0.0,
        dx: 0.0,
        dy: 1.0,
        nx: -1.0,
        ny: 0.0,
        absX:
          this.arenaSettings.width -
          this.arenaSettings.paddleHeight / 2.0 -
          this.arenaSettings.paddleOffset,
        absY: this.arenaSettings.height / 2.0,
        coverage: this.arenaSettings.paddleCoverage,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.arenaSettings.paddleHeight,
        speed: paddleSpeedPercent,
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
      } as Paddle,
    ];
  }

  initWalls(): void {
    this.gameObjects.walls = [
      // LEFT WALL
      {
        doCollision: true,
        id: 0,
        x: 0.0,
        y: this.arenaSettings.height / 2.0,
        alpha: Math.PI,
        dx: 0.0,
        dy: -1.0,
        nx: 1.0,
        ny: 0.0,
        absX: 0.0,
        absY: this.arenaSettings.height / 2.0,
        width: this.arenaSettings.height,
        height: this.arenaSettings.wallHeight,
        isVisible: true,
        isGoal: true,
      } as Rectangle,

      // UP WALL
      {
        doCollision: true,
        id: 1,
        x: this.arenaSettings.width / 2.0,
        y: 0.0,
        alpha: Math.PI / 4.0,
        dx: 1.0,
        dy: 0.0,
        nx: 0.0,
        ny: 1.0,
        absX: this.arenaSettings.width / 2.0,
        absY: 0.0,
        width: this.arenaSettings.width,
        height: this.arenaSettings.wallHeight,
        isVisible: true,
        isGoal: false,
      } as Rectangle,

      // RIGHT WALL
      {
        doCollision: true,
        id: 2,
        x: this.arenaSettings.width,
        y: this.arenaSettings.height / 2.0,
        alpha: 0.0,
        dx: 0.0,
        dy: 1.0,
        nx: -1.0,
        ny: 0.0,
        absX: this.arenaSettings.width,
        absY: this.arenaSettings.height / 2.0,
        width: this.arenaSettings.height,
        height: this.arenaSettings.wallHeight,
        isVisible: true,
        isGoal: true,
      } as Rectangle,

      // DOWN WALL
      {
        doCollision: true,
        id: 3,
        x: this.arenaSettings.width / 2.0,
        y: this.arenaSettings.height,
        alpha: -Math.PI / 4.0,
        dx: -1.0,
        dy: 0.0,
        nx: 0.0,
        ny: -1.0,
        absX: this.arenaSettings.width / 2.0,
        absY: this.arenaSettings.height,
        width: this.arenaSettings.width,
        height: this.arenaSettings.wallHeight,
        isVisible: true,
        isGoal: false,
      } as Rectangle,
    ];
  }

  // Updated to use edit queue
  resetBall(ballId: number = -1): void {
    const randomAngle = this.rng.random() * Math.PI * 2.0;
    const ca = Math.cos(randomAngle);
    const sa = Math.sin(randomAngle);

    if (ballId < 0) {
      // Reset all balls
      this.gameObjects.balls = [
        {
          id: 0,
          x:
            this.arenaSettings.width / 2.0 +
            this.arenaSettings.paddleOffset * ca,
          y:
            this.arenaSettings.height / 2.0 +
            this.arenaSettings.paddleOffset * sa,
          dx: ca,
          dy: sa,
          speed: this.defaultBallSettings.speed,
          radius: this.defaultBallSettings.radius,
          isVisible: true,
          doCollision: true,
          doGoal: true,
        },
      ];
    } else {
      // Find the ball by ID and update it
      this.gameObjects.balls[ballId] = {
        id: ballId,
        x:
          this.arenaSettings.width / 2.0 + this.arenaSettings.paddleOffset * ca,
        y:
          this.arenaSettings.height / 2.0 +
          this.arenaSettings.paddleOffset * sa,
        dx: ca,
        dy: sa,
        speed: this.defaultBallSettings.speed,
        radius: this.defaultBallSettings.radius,
        isVisible: true,
        doCollision: true,
        doGoal: true,
      };
    }
  }

  rotatePaddles(alpha: number = 0.0): void {
    const paddleAmplitude =
      (this.arenaSettings.wallDistance - this.arenaSettings.paddleOffset) *
      Math.sin(Math.PI / this.extraGameData.playerCount);

    for (let idx = 0; idx < this.gameObjects.paddles.length; idx++) {
      const paddle = this.gameObjects.paddles[idx];
      const baseAngle =
        Math.PI + (2 * Math.PI * idx) / this.extraGameData.playerCount;

      // Apply rotation offset
      const newAngle = baseAngle + alpha;

      // Compute base position
      const baseX =
        (this.arenaSettings.wallDistance - this.arenaSettings.paddleOffset) *
        Math.cos(newAngle);
      const baseY =
        (this.arenaSettings.wallDistance - this.arenaSettings.paddleOffset) *
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

      // Get current displacement
      const disp = Math.floor(
        paddle.displacement / this.arenaSettings.paddleSpeedWidthPercent,
      );

      // Update position with displacement
      const finalX = baseX + disp * paddle.dx * paddle.speed;
      const finalY = baseY + disp * paddle.dy * paddle.speed;

      // Adjust for arena offset
      paddle.x = parseFloat(
        (finalX + this.arenaSettings.wallDistance).toFixed(3),
      );
      paddle.y = parseFloat(
        (finalY + this.arenaSettings.wallDistance).toFixed(3),
      );

      // Update angle
      paddle.alpha = parseFloat(newAngle.toFixed(3));

      // Update width and speed
      paddle.width = parseFloat(
        (paddleAmplitude * (this.arenaSettings.paddleCoverage / 100.0)).toFixed(
          3,
        ),
      );
      paddle.speed = parseFloat(
        (
          paddleAmplitude *
          (this.arenaSettings.paddleSpeedWidthPercent / 100.0)
        ).toFixed(3),
      );
    }
  }

  rotateWalls(alpha: number = 0.0): void {
    const centerX = this.arenaSettings.wallDistance;
    const centerY = this.arenaSettings.wallDistance;
    const cosA = Math.cos(alpha);
    const sinA = Math.sin(alpha);

    for (let id = 0; id < this.gameObjects.walls.length; id++) {
      // Skip the center wall and extra walls
      if (id >= 2 * this.extraGameData.playerCount) {
        continue;
      }

      const wall = this.gameObjects.walls[id];

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
      this.arenaSettings.wallHeight + this.arenaSettings.paddleOffset;

    return (
      ball.x <= -tolerance ||
      ball.x >= this.arenaSettings.width + tolerance ||
      ball.y <= -tolerance ||
      ball.y >= this.arenaSettings.height + tolerance
    );
  }

  getResults(): number[] {
    const p1result: number =
      this.extraGameData.scores[0] > this.extraGameData.scores[1] ? 1 : 2;
    const p2result: number = (p1result % 2) + 1;

    return [p1result, p2result];
  }
}
