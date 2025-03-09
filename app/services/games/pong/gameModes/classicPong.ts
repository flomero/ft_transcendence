import { Pong } from "../pong";
import { Rectangle } from "../../../../types/games/pong/rectangle";
import { Ball } from "../../../../types/games/pong/ball";
import { Paddle } from "../../../../types/games/pong/paddle";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";

export class ClassicPong extends Pong {
  protected defaultBallSettings: Record<string, any>;

  constructor(gameData: Record<string, any>) {
    super(gameData);

    this.defaultBallSettings =
      GAME_REGISTRY.pong.gameModes[
        gameData["gameModeName"]
      ].defaultBallSettings;

    this.resetBall();
    this.initPaddles();
    this.initWalls();
  }

  initPaddles(): void {
    // Compute initial paddle positions, rotated by alpha
    const paddleAmplitude =
      (this.arenaSettings.height - this.arenaSettings.paddleOffset) *
      Math.sin(Math.PI / this.extraGameData.playerCount);

    this.gameObjects.paddles = [
      // LEFT PADDLE
      {
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
        width: paddleAmplitude * (this.arenaSettings.paddleCoverage / 100.0),
        height: this.arenaSettings.paddleHeight,
        speed:
          paddleAmplitude *
          (this.arenaSettings.paddleSpeedWidthPercent / 100.0),
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
      } as Paddle,

      // RIGHT PADDLE
      {
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
        width: paddleAmplitude * (this.arenaSettings.paddleCoverage / 100.0),
        height: this.arenaSettings.paddleHeight,
        speed:
          paddleAmplitude *
          (this.arenaSettings.paddleSpeedWidthPercent / 100.0),
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
      } as Paddle,
    ];

    // this.gameObjects.paddles.forEach((paddle) => {console.log(paddle)})

    // this.gameObjects.paddles = [];
    // for (let i = 0; i < this.extraGameData.playerCount; ++i) {
    //   const paddle: Record<string, any> = {
    //     x: parseFloat(
    //         ((this.arenaSettings.width / 2.0 - this.arenaSettings.paddleOffset) *
    //         Math.cos((Math.PI * i) / this.extraGameData.playerCount + Math.PI)).toFixed(3)
    //     ),
    //     y: parseFloat(
    //         ((this.arenaSettings.height / 2.0 - this.arenaSettings.paddleOffset) *
    //         Math.cos((Math.PI * i) / this.extraGameData.playerCount + Math.PI)).toFixed(3)
    //     ),
    //     alpha: parseFloat(
    //       (Math.PI + (Math.PI * i) / this.extraGameData.playerCount).toFixed(3),
    //     ),
    //     coverage: this.arenaSettings.paddleCoverage,
    //     width: paddleAmplitude * (this.arenaSettings.paddleCoverage / 100.0),
    //     height: this.arenaSettings.paddleHeight,
    //     speed: paddleAmplitude * (this.arenaSettings.paddleSpeedWidthPercent / 100.0),
    //     doMove: true,
    //     isVisible: true,
    //     velocity: 0.0,
    //     displacement: 0.0,
    //   };

    //   const tmp: number = Math.sqrt(paddle.x ** 2 + paddle.y ** 2);
    //   if (tmp !== 0) {
    //     paddle.nx = -paddle.x / tmp;
    //     paddle.ny = -paddle.y / tmp;
    //   }

    //   paddle.x += this.arenaSettings.width;
    //   paddle.y += this.arenaSettings.height;

    //   paddle.dx = paddle.ny;
    //   paddle.dy = -paddle.nx;

    //   paddle.absX = paddle.x;
    //   paddle.absY = paddle.y;

    // console.log(paddle as Paddle);

    // this.gameObjects.paddles.push(paddle as Paddle);
    // }
  }

  initWalls(): void {
    // Initialize walls, rotate by alpha
    // const wallWidth =
    //   2.0 *
    //   Math.sin(Math.PI / (2.0 * this.extraGameData.playerCount)) *
    //   (this.arenaSettings.width *
    //     (1 + 1 / (this.extraGameData.playerCount + 0.5)));
    this.gameObjects.walls = [
      // LEFT WALL
      {
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

    // this.gameObjects.walls.forEach((wall) => {console.log(wall)})

    // Create walls forming a regular polygon
    // for (let i = 0; i < 2 * this.extraGameData.playerCount; i++) {
    //   const wall: Record<string, any> = {
    //     x: parseFloat(
    //       (
    //         (this.arenaSettings.width -
    //           this.arenaSettings.wallHeight * (i % 2) * 1.0) *
    //         Math.cos((Math.PI * i) / this.extraGameData.playerCount + Math.PI)
    //       ).toFixed(3),
    //     ),
    //     y: parseFloat(
    //       (
    //         (this.arenaSettings.height -
    //           this.arenaSettings.wallHeight * (i % 2) * 1.0) *
    //         Math.sin((Math.PI * i) / this.extraGameData.playerCount + Math.PI)
    //       ).toFixed(3),
    //     ),
    //     alpha: parseFloat(
    //       (Math.PI + (Math.PI * i) / this.extraGameData.playerCount).toFixed(3),
    //     ),
    //     width: this.arenaSettings.width,
    //     height: this.arenaSettings.wallHeight,
    //     isVisible: true,
    //   };

    //   const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

    //   if (tmp !== 0) {
    //     wall.nx = -wall.x / tmp;
    //     wall.ny = -wall.y / tmp;
    //   }

    //   wall.absX = wall.x;
    //   wall.absY = wall.y;
    //   wall.x += this.arenaSettings.width;
    //   wall.y += this.arenaSettings.height;

    //   wall.dx = wall.ny;
    //   wall.dy = -wall.nx;

    //   this.gameObjects.walls.push(wall as Rectangle);
    // }

    // Add small walls between players for more bounces if player count > 2
    // if (this.extraGameData.playerCount > 2) {
    //   for (let i = 0; i < 2 * this.extraGameData.playerCount; i += 2) {
    //     const wall: Record<string, any> = {
    //       x: parseFloat(
    //         (
    //           ((this.arenaSettings.wallDistance * 3.0) / 5.0) *
    //           Math.cos(
    //             (Math.PI * (i + 1.0)) / this.extraGameData.playerCount +
    //               Math.PI,
    //           )
    //         ).toFixed(3),
    //       ),
    //       y: parseFloat(
    //         (
    //           ((this.arenaSettings.wallDistance * 3.0) / 5.0) *
    //           Math.sin(
    //             (Math.PI * (i + 1.0)) / this.extraGameData.playerCount +
    //               Math.PI,
    //           )
    //         ).toFixed(3),
    //       ),
    //       alpha: parseFloat(
    //         (
    //           Math.PI +
    //           (Math.PI * (i + 1.0)) / this.extraGameData.playerCount
    //         ).toFixed(3),
    //       ),
    //       width: this.arenaSettings.wallHeight / 2.5,
    //       height: wallWidth / 6.5,
    //       isVisible: true,
    //     };

    //     const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

    //     if (tmp !== 0) {
    //       wall.nx = -wall.x / tmp;
    //       wall.ny = -wall.y / tmp;
    //     }

    //     wall.absX = wall.x;
    //     wall.absY = wall.y;
    //     wall.x += this.arenaSettings.wallDistance;
    //     wall.y += this.arenaSettings.wallDistance;

    //     wall.dx = wall.ny;
    //     wall.dy = -wall.nx;

    //     this.gameObjects.walls.push(wall as Rectangle);
    //   }
    // }

    // Process all walls
    // for (let i = 0; i < this.gameObjects.walls.length; i++) {
    //   const wall = this.gameObjects.walls[i];
    //   const tmp = Math.sqrt(wall.x ** 2 + wall.y ** 2);

    //   if (tmp !== 0) {
    //     wall.nx = -wall.x / tmp;
    //     wall.ny = -wall.y / tmp;
    //   }

    //   wall.absX = wall.x;
    //   wall.absY = wall.y;
    //   wall.x += this.arenaSettings.wallDistance;
    //   wall.y += this.arenaSettings.wallDistance;

    //   wall.dx = wall.ny;
    //   wall.dy = -wall.nx;
    // }

    // // Add central wall
    // this.gameObjects.walls.push({
    //   x: this.arenaSettings.width,
    //   y: this.arenaSettings.height,
    //   alpha: Math.PI / 4.0,
    //   width: 1.0,
    //   height: 1.0,
    //   isVisible: true,
    //   nx: Math.sin(Math.PI / 4.0),
    //   ny: Math.cos(Math.PI / 4.0),
    //   dx: Math.cos(Math.PI / 4.0),
    //   dy: -Math.sin(Math.PI / 4.0),
    //   absX: this.arenaSettings.width,
    //   absY: this.arenaSettings.height,
    // });
  }

  resetBall(ballId: number = -1): void {
    const randomAngle = this.rng.random() * Math.PI * 2.0;
    const ca = Math.cos(randomAngle);
    const sa = Math.sin(randomAngle);

    const newBall: Ball = {
      x: this.arenaSettings.width / 2.0 + this.arenaSettings.paddleOffset * ca,
      y: this.arenaSettings.height / 2.0 + this.arenaSettings.paddleOffset * sa,
      dx: ca,
      dy: sa,
      speed: this.defaultBallSettings.speed,
      radius: this.defaultBallSettings.radius,
      isVisible: true,
      doCollision: true,
      doGoal: true,
    };

    if (ballId < 0 || ballId >= this.gameObjects.balls.length) {
      this.gameObjects.balls = [newBall];
    } else {
      this.gameObjects.balls[ballId] = newBall;
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
      2.0 * (this.arenaSettings.wallHeight + this.arenaSettings.paddleOffset);

    return (
      ball.x <= -tolerance ||
      ball.x >= this.arenaSettings.width + tolerance ||
      ball.y <= -tolerance ||
      ball.y >= this.arenaSettings.height + tolerance
    );
  }
}
