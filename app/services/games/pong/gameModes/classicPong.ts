import { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import type { Ball } from "../../../../types/games/pong/ball";
import type { Paddle } from "../../../../types/games/pong/paddle";
import {
  GAME_REGISTRY,
  type GameModeCombinedSettings,
} from "../../../../types/games/gameRegistry";
import { IPongBallResetSampler } from "../../../../types/strategy/IPongBallResetSampler";
import { StrategyManager } from "../../../strategy/strategyManager";

export class ClassicPong extends Pong {
  name = "classicPong";

  protected settings: GameModeCombinedSettings;

  protected ballResetSampler: StrategyManager<
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

      // Customizable settings
      ballSpeedWidthPercentS:
        customConfig.ballSpeedWidthPercentS ||
        registry.customizableSettings.ballSpeedWidthPercentS,
      ballRadius:
        customConfig.ballRadius || registry.customizableSettings.ballRadius,
      ballResetSamplerStrategyName:
        customConfig.ballResetSamplerStrategyName ||
        registry.customizableSettings.ballResetSamplerStrategyName,
      paddleCoveragePercent:
        customConfig.paddleCoveragePercent ||
        registry.customizableSettings.paddleCoveragePercent,
      paddleSpeedWidthPercentS:
        customConfig.paddleSpeedWidthPercentS ||
        registry.customizableSettings.paddleSpeedWidthPercentS,
      powerUpRadius:
        customConfig.powerUpRadius ||
        registry.customizableSettings.powerUpRadius,
      powerUpCapacities: registry.customizableSettings.powerUpCapacities,
    };

    this.settings.ballSpeed =
      (this.settings.arenaWidth *
        (this.settings.ballSpeedWidthPercentS / 100)) /
      this.serverTickrateS;

    if (customConfig.powerUpCapacities)
      for (const [key, value] of Object.entries(
        customConfig.powerUpCapacities as Record<string, number>,
      ))
        this.settings.powerUpCapacities[key] = value;

    console.dir(this.settings, { depth: null });

    this.ballResetSampler = new StrategyManager(
      this.settings.ballResetSamplerStrategyName,
      "pongBallResetSampler",
      "sampleDirection",
    );

    // Initializing GameObjects
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
    const paddleAmplitude =
      this.settings.arenaHeight - this.settings.wallsHeight;

    // Calculate the coverage percentage (0 to 1)
    const coverage = this.settings.paddleCoveragePercent / 100.0;
    const maxDisplacement = (100 - this.settings.paddleCoveragePercent) / 2.0;

    // Calculate actual paddle width based on amplitude and coverage
    const paddleWidth = paddleAmplitude * coverage;

    // paddleSpeed is percentage of width per second (independent of tickrate)
    const paddleSpeedPercent = this.settings.paddleSpeedWidthPercentS / 100.0;

    this.gameState.paddles = [
      // LEFT PADDLE
      {
        doCollision: true,
        id: 0,
        x: this.settings.paddleHeight / 2.0 + this.settings.paddleOffset,
        y: this.settings.arenaHeight / 2.0,
        alpha: Math.PI,
        dx: 0.0,
        dy: -1.0,
        nx: 1.0,
        ny: 0.0,
        absX: this.settings.paddleHeight / 2.0 + this.settings.paddleOffset,
        absY: this.settings.arenaHeight / 2.0,
        coverage: this.settings.paddleCoveragePercent,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.settings.paddleHeight,
        speed: paddleSpeedPercent,
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
        maxDisplacement: maxDisplacement,
      } as Paddle,

      // RIGHT PADDLE
      {
        doCollision: true,
        id: 1,
        x:
          this.settings.arenaWidth -
          this.settings.paddleHeight / 2.0 -
          this.settings.paddleOffset,
        y: this.settings.arenaHeight / 2.0,
        alpha: 0.0,
        dx: 0.0,
        dy: 1.0,
        nx: -1.0,
        ny: 0.0,
        absX:
          this.settings.arenaWidth -
          this.settings.paddleHeight / 2.0 -
          this.settings.paddleOffset,
        absY: this.settings.arenaHeight / 2.0,
        coverage: this.settings.paddleCoveragePercent,
        amplitude: paddleAmplitude,
        width: paddleWidth,
        height: this.settings.paddleHeight,
        speed: paddleSpeedPercent,
        velocity: 0.0,
        displacement: 0.0,
        doMove: true,
        isVisible: true,
        maxDisplacement: maxDisplacement,
      } as Paddle,
    ];
  }

  initWalls(): void {
    this.gameState.walls = [
      // LEFT WALL
      {
        doCollision: true,
        id: 0,
        x: 0.0,
        y: this.settings.arenaHeight / 2.0,
        alpha: Math.PI,
        dx: 0.0,
        dy: -1.0,
        nx: 1.0,
        ny: 0.0,
        absX: 0.0,
        absY: this.settings.arenaHeight / 2.0,
        width: this.settings.arenaHeight,
        height: this.settings.wallsHeight,
        isVisible: true,
        isGoal: true,
      } as Rectangle,

      // UP WALL
      {
        doCollision: true,
        id: 1,
        x: this.settings.arenaWidth / 2.0,
        y: 0.0,
        alpha: Math.PI / 4.0,
        dx: 1.0,
        dy: 0.0,
        nx: 0.0,
        ny: 1.0,
        absX: this.settings.arenaWidth / 2.0,
        absY: 0.0,
        width: this.settings.arenaWidth,
        height: this.settings.wallsHeight,
        isVisible: true,
        isGoal: false,
      } as Rectangle,

      // RIGHT WALL
      {
        doCollision: true,
        id: 2,
        x: this.settings.arenaWidth,
        y: this.settings.arenaHeight / 2.0,
        alpha: 0.0,
        dx: 0.0,
        dy: 1.0,
        nx: -1.0,
        ny: 0.0,
        absX: this.settings.arenaWidth,
        absY: this.settings.arenaHeight / 2.0,
        width: this.settings.arenaHeight,
        height: this.settings.wallsHeight,
        isVisible: true,
        isGoal: true,
      } as Rectangle,

      // DOWN WALL
      {
        doCollision: true,
        id: 3,
        x: this.settings.arenaWidth / 2.0,
        y: this.settings.arenaHeight,
        alpha: -Math.PI / 4.0,
        dx: -1.0,
        dy: 0.0,
        nx: 0.0,
        ny: -1.0,
        absX: this.settings.arenaWidth / 2.0,
        absY: this.settings.arenaHeight,
        width: this.settings.arenaWidth,
        height: this.settings.wallsHeight,
        isVisible: true,
        isGoal: false,
      } as Rectangle,
    ];
  }

  resetBall(
    gameState: Record<string, any>,
    ballId: number,
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

  isOutOfBounds(ball: Ball): boolean {
    const tolerance: number =
      this.settings.wallsHeight + this.settings.paddleOffset;

    return (
      ball.x <= -tolerance ||
      ball.x >= this.settings.arenaWidth + tolerance ||
      ball.y <= -tolerance ||
      ball.y >= this.settings.arenaHeight + tolerance
    );
  }

  getResults(): number[] {
    const scores = this.gameState.scores;
    const p1result: number = scores[0] > scores[1] ? 1 : 2;
    const p2result: number = (p1result % 2) + 1;

    return [p1result, p2result];
  }

  getSettings(): GameModeCombinedSettings {
    return this.settings;
  }
}
