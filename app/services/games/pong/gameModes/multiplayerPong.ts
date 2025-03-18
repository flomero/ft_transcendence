import { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import type { Ball } from "../../../../types/games/pong/ball";
import type { Paddle } from "../../../../types/games/pong/paddle";
import {
  type BallSettings,
  GAME_REGISTRY,
} from "../../../../types/games/gameRegistry";

export class MultiplayerPong extends Pong {
  name = "multiplayerPong";

  protected defaultBallSettings: BallSettings;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    const defaultBallSettingsS: Record<string, any> =
      GAME_REGISTRY.pong.gameModes[this.name].defaultBallSettings;

    this.defaultBallSettings = {
      speed:
        (2.0 *
          this.arenaSettings.radius *
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
    // Calculate paddleAmplitude - the maximum possible distance the paddle can travel
    const paddleAmplitude =
      (this.arenaSettings.radius - this.arenaSettings.paddleOffset) *
      Math.sin(Math.PI / this.extraGameData.playerCount);

    // Calculate the coverage percentage (0 to 1)
    const coverage = this.arenaSettings.paddleCoverage / 100.0;

    // Calculate actual paddle width based on amplitude and coverage
    const paddleWidth = paddleAmplitude * coverage;

    // paddleSpeed is percentage of width per second (independent of tickrate)
    const paddleSpeedPercent =
      this.arenaSettings.paddleSpeedWidthPercentS / 100.0;

    for (let index = 0; index < this.extraGameData.playerCount; ++index) {
      const angle =
        Math.PI + (Math.PI * 2 * index) / this.extraGameData.playerCount;
      const radius =
        this.arenaSettings.radius - this.arenaSettings.paddleOffset;

      let paddle: Paddle = {
        id: index,
        x: parseFloat((radius * Math.cos(angle)).toFixed(3)),
        y: parseFloat((radius * Math.sin(angle)).toFixed(3)),
        alpha: parseFloat(angle.toFixed(3)),
        coverage: this.arenaSettings.paddleCoverage,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.arenaSettings.paddleHeight,
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
      };

      const tmp: number = Math.sqrt(paddle.x ** 2 + paddle.y ** 2);
      if (tmp !== 0) {
        paddle.nx = -paddle.x / tmp;
        paddle.ny = -paddle.y / tmp;
      }

      paddle.x += this.arenaSettings.radius;
      paddle.y += this.arenaSettings.radius;

      paddle.dx = paddle.ny;
      paddle.dy = -paddle.nx;

      paddle.absX = paddle.x;
      paddle.absY = paddle.y;

      this.gameObjects.paddles.push(paddle);
    }
  }

  initWalls(): void {
    // Initialize walls, rotate by alpha
    const wallWidth =
      2.0 *
      Math.sin(Math.PI / (2.0 * this.extraGameData.playerCount)) *
      (this.arenaSettings.radius *
        (1 + 1 / (this.extraGameData.playerCount + 0.5)));

    for (let index = 0; index < 2 * this.extraGameData.playerCount; index++) {
      const wall: Rectangle = {
        id: index,
        x: parseFloat(
          (
            (this.arenaSettings.radius -
              this.arenaSettings.wallOffset * (index % 2)) *
            Math.cos(
              (Math.PI * index) / this.extraGameData.playerCount + Math.PI,
            )
          ).toFixed(3),
        ),
        y: parseFloat(
          (
            (this.arenaSettings.radius -
              this.arenaSettings.wallOffset * (index % 2)) *
            Math.sin(
              (Math.PI * index) / this.extraGameData.playerCount + Math.PI,
            )
          ).toFixed(3),
        ),
        alpha: parseFloat(
          (
            Math.PI +
            (Math.PI * index) / this.extraGameData.playerCount
          ).toFixed(3),
        ),
        width: wallWidth,
        height: this.arenaSettings.wallHeight,
        isVisible: index % 2 == 1,
        absX: 0,
        absY: 0,
        nx: 0,
        ny: 0,
        dx: 0,
        dy: 0,
        isGoal: index % 2 == 0,
        doCollision: true,
      };

      const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

      if (tmp !== 0) {
        wall.nx = -wall.x / tmp;
        wall.ny = -wall.y / tmp;
      }

      wall.absX = wall.x;
      wall.absY = wall.y;
      wall.x += this.arenaSettings.radius;
      wall.y += this.arenaSettings.radius;

      wall.dx = wall.ny;
      wall.dy = -wall.nx;

      this.gameObjects.walls.push(wall);
    }
  }

  resetBall(ballId: number = -1): void {
    const randomAngle = this.rng.random() * Math.PI * 2.0;
    const ca = Math.cos(randomAngle);
    const sa = Math.sin(randomAngle);

    if (ballId < 0) {
      // Reset all balls
      this.gameObjects.balls = [
        {
          id: 0,
          x: this.arenaSettings.radius + this.arenaSettings.paddleOffset * ca,
          y: this.arenaSettings.radius + this.arenaSettings.paddleOffset * sa,
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
        x: this.arenaSettings.radius + this.arenaSettings.paddleOffset * ca,
        y: this.arenaSettings.radius + this.arenaSettings.paddleOffset * sa,
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

    const distance =
      (ball.x - this.arenaSettings.radius) ** 2 +
      (ball.y - this.arenaSettings.radius) ** 2;
    return (
      distance >= tolerance + this.arenaSettings.radius ** 2 + ball.radius ** 2
    );
  }

  getResults(): number[] {
    const p1result: number =
      this.extraGameData.scores[0] > this.extraGameData.scores[1] ? 1 : 2;
    const p2result: number = (p1result % 2) + 1;

    return [p1result, p2result];
  }
}
