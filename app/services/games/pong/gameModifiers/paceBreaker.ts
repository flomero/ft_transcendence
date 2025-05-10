import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Pong } from "../pong";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";

interface TwoPaddlesBounce {
  count: number;
  paddles: Array<number>;
}

interface OnePaddleBounce {
  count: number;
  paddle: number;
}

export class PaceBreaker extends TimeLimitedModifierBase {
  name = "paceBreaker";

  protected noResetThreshold: number = 0;
  protected noPaddleBounceThreshold: number = 0;
  protected noPaddleBounceCount: number = 0;

  // 3+ players - 2 player loop detection
  protected twoPaddlesBounceThreshold: number = 0;
  protected twoPaddlesBounce: TwoPaddlesBounce = { count: 0, paddles: [] };

  // 1v1 vertical loop detection
  protected onePaddleBounceThreshold: number = 0;
  protected onePaddleBounceCount: OnePaddleBounce = { count: 0, paddle: -1 };

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.gameModifiers[this.name];

    this.configManager.registerPropertyConfig(
      "noResetThreshold",
      (_, context) => {
        const noResetThresholdS =
          context.noResetThreshold || defaultRegistry.noResetThresholdS;
        return noResetThresholdS * serverTickrateS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "noPaddleBounceThreshold",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "twoPaddlesBounceThreshold",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "onePaddleBounceThreshold",
      (value) => value,
      undefined,
    );

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach(([key, value]) => {
        mergedConfig[key] = value;
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.duration = this.noResetThreshold;
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    this.resetTrackers();
  }

  onPaddleBounce(game: Pong, args: { ballId: number; playerId: number }): void {
    if (args.ballId !== 0) return;
    const gameState = game.getState();

    // refresh timeouts
    this.ticks = this.duration;
    this.noPaddleBounceCount = 0;

    // ignore duplicate collision events
    if (
      this.twoPaddlesBounce.paddles.length > 1 &&
      this.twoPaddlesBounce.paddles[
        this.twoPaddlesBounce.paddles.length - 1
      ] === args.playerId
    ) {
      return;
    }

    // 3+ players: two-paddle loop detection
    if (gameState.playerCount > 2) {
      if (this.twoPaddlesBounce.paddles.length < 2) {
        this.twoPaddlesBounce.paddles.push(args.playerId);
      } else if (
        this.twoPaddlesBounce.paddles[
          this.twoPaddlesBounce.paddles.length - 2
        ] === args.playerId
      ) {
        this.twoPaddlesBounce.count++;
        this.twoPaddlesBounce.paddles.push(args.playerId);
      } else {
        this.twoPaddlesBounce.count = 0;
        const last =
          this.twoPaddlesBounce.paddles[
            this.twoPaddlesBounce.paddles.length - 1
          ];
        this.twoPaddlesBounce.paddles = [last, args.playerId];
      }

      if (this.twoPaddlesBounce.count >= this.twoPaddlesBounceThreshold) {
        this.deactivate(game);
        return;
      }
    }

    // 1v1 vertical wall-loop detection
    if (gameState.playerCount === 2) {
      // if bouncing after a wall and same paddle, count it
      if (this.onePaddleBounceCount.paddle === args.playerId)
        this.onePaddleBounceCount.count++;
      else this.onePaddleBounceCount.count = 0;

      this.onePaddleBounceCount.paddle = args.playerId;

      if (this.onePaddleBounceCount.count >= this.onePaddleBounceThreshold)
        this.deactivate(game);
    }
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }): void {
    if (args.ballID !== 0) return;
    this.noPaddleBounceCount++;
    if (this.noPaddleBounceCount >= this.noPaddleBounceThreshold) {
      this.deactivate(game);
      return;
    }
  }

  onDeactivation(game: Pong): void {
    this.nudgeBall(game);
    this.resetTrackers();
    this.activate(game);
  }

  protected nudgeBall(game: Pong) {
    // console.log(`Nudging the ball`);
    const gameState = game.getState();

    let maxEntry: { dir: { x: number; y: number }; mag: number } | null = null;

    for (let i = 0; i < gameState.paddles.length; i++) {
      if (game.isEliminated(i)) continue;
      const p = gameState.paddles[i];
      const dx = p.x - gameState.balls[0].x;
      const dy = p.y - gameState.balls[0].y;
      const mag = Math.hypot(dx, dy);

      if (!maxEntry || mag > maxEntry.mag) {
        maxEntry = { dir: { x: dx, y: dy }, mag };
      }
    }

    if (maxEntry) {
      gameState.balls[0].dx = maxEntry.dir.x / (maxEntry.mag || 1);
      gameState.balls[0].dy = maxEntry.dir.y / (maxEntry.mag || 1);
    }
  }

  protected resetTrackers() {
    this.ticks = this.duration;
    this.noPaddleBounceCount = 0;
    this.twoPaddlesBounce = { count: 0, paddles: [] };
    this.onePaddleBounceCount = { count: 0, paddle: -1 };
  }
}
