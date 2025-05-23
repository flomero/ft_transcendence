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
import { fastifyInstance } from "../../../../app";

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
      minBallSpeed: registry.fixedSettings.wallsOffset,

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

    // Minimum ball speed defined as a percentage of the initial ball speed
    this.settings.minBallSpeed =
      (this.settings.minBallSpeed * this.settings.ballSpeed) / 100.0;

    this.settings.arenaRadius = this.settings.arenaWidth / 2.0;

    if (customConfig.powerUpCapacities)
      for (const [key, value] of Object.entries(
        customConfig.powerUpCapacities as Record<string, number>,
      ))
        this.settings.powerUpCapacities[key] = value;

    this.ballResetSampler = new StrategyManager(
      this.settings.ballResetSampler,
      "pongBallResetSampler",
      "sampleDirection",
    );

    this.initWalls();
    this.initPaddles();
    this.resetBall(this.gameState, -1, true);
  }

  startGame(): void {
    super.startGame();
    fastifyInstance.log.info("Game Started");
  }

  initPaddles(): void {
    // Calculate paddleAmplitude - the maximum possible distance the paddle can travel
    const paddleAmplitude =
      (this.gameState.walls[0].width *
        (this.settings.arenaRadius - this.settings.paddleOffset)) /
      this.settings.arenaRadius;

    // Calculate the coverage percentage (0 to 1)
    const coverage = this.settings.paddleCoveragePercent / 100.0;
    const maxDisplacement = (100 - this.settings.paddleCoveragePercent) / 2.0;

    // Calculate actual paddle width based on amplitude and coverage
    const paddleWidth = paddleAmplitude * coverage;

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const paddleSpeed =
      100 / (serverTickrateS * this.settings.paddleSpeedWidthPercentS);

    fastifyInstance.log.debug(`Paddle amplitude: ${paddleAmplitude}`);
    fastifyInstance.log.debug(`Paddle speed: ${paddleSpeed}`);

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
        doBoundsProtection: true,
        doResolveCollision: true,
        speed: paddleSpeed,
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
        doBoundsProtection: true,
        doResolveCollision: true,
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
    const newWidths: number[] = new Array(totalWalls);

    // First compute all new widths without modifying the walls
    for (let i = 0; i < totalWalls; i++) {
      const currentWall = this.gameState.walls[i];
      const nextWallIndex = (i + 1) % totalWalls;
      const nextWall = this.gameState.walls[nextWallIndex];

      const currentWallInfos = {
        x: currentWall.x - (currentWall.nx * currentWall.height) / 2.0,
        y: currentWall.y - (currentWall.ny * currentWall.height) / 2.0,
        vectorX: currentWall.dx,
        vectorY: currentWall.dy,
      };

      const nextWallInfos = {
        x: nextWall.x - (nextWall.nx * nextWall.height) / 2.0,
        y: nextWall.y - (nextWall.ny * nextWall.height) / 2.0,
        vectorX: -nextWall.dx,
        vectorY: -nextWall.dy,
      };

      // Compute intersection point between the two lines
      // Line 1: currentWallInfos.x + t * currentWallInfos.vectorX, currentWallInfos.y + t * currentWallInfos.vectorY
      // Line 2: nextWallInfos.x + s * nextWallInfos.vectorX, nextWallInfos.y + s * nextWallInfos.vectorY

      // Using the formula for line intersection:
      // det = cross(v1, v2) = v1.x * v2.y - v1.y * v2.x
      const det =
        currentWallInfos.vectorX * nextWallInfos.vectorY -
        currentWallInfos.vectorY * nextWallInfos.vectorX;

      // If det is close to 0, lines are parallel and won't intersect properly
      if (Math.abs(det) < 1e-10) {
        // Fallback to default width if no intersection
        newWidths[i] = wallWidth;
        continue;
      }

      // Calculate vector between starting points
      const dx = nextWallInfos.x - currentWallInfos.x;
      const dy = nextWallInfos.y - currentWallInfos.y;

      // Calculate parameters t and s
      const t = (dx * nextWallInfos.vectorY - dy * nextWallInfos.vectorX) / det;

      // We only need t for the current wall to determine its width
      // The intersection point
      const intersectionX = currentWallInfos.x + t * currentWallInfos.vectorX;
      const intersectionY = currentWallInfos.y + t * currentWallInfos.vectorY;

      // Calculate distance from the wall's center to the intersection point
      const centerToIntersectionX = intersectionX - currentWall.x;
      const centerToIntersectionY = intersectionY - currentWall.y;

      // Project this vector onto the wall's direction vector
      const projectionLength =
        centerToIntersectionX * currentWallInfos.vectorX +
        centerToIntersectionY * currentWallInfos.vectorY;

      // The new width should be twice this projection (to extend from center)
      newWidths[i] = Math.abs(projectionLength) * 2;

      // Add a small margin to ensure walls overlap
      const overlapMargin = 0.01; // Small overlap to prevent gaps
      newWidths[i] += overlapMargin;
    }

    // Now update all walls with their new widths
    for (let i = 0; i < totalWalls; i++) {
      this.gameState.walls[i].width = newWidths[i];
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

    if (doTriggers)
      this.modifierManager.trigger("onBallReset", { ballID: ballId });
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
      this.settings.paddleOffset +
      this.settings.paddleHeight;

    if (
      ball.x <= -tolerance ||
      ball.y <= -tolerance ||
      ball.x >= this.settings.arenaWidth + tolerance ||
      ball.y >= this.settings.arenaHeight + tolerance
    )
      return true;

    const dx = ball.x - this.settings.arenaRadius;
    const dy = ball.y - this.settings.arenaRadius;
    const distanceSquared = dx * dx + dy * dy;

    const allowedRadius = this.settings.arenaRadius + tolerance - ball.radius;
    return distanceSquared > allowedRadius * allowedRadius;
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
