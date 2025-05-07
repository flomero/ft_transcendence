import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Pong } from "../pong";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";

interface TwoPaddlesBounce {
  count: number;
  paddles: Array<number>;
}

export class PaceBreaker extends TimeLimitedModifierBase {
  name = "paceBreaker";

  protected noResetThreshold: number = 0;
  protected noPaddleBounceThreshold: number = 0;
  protected noPaddleBounceCount: number = 0;

  protected twoPaddlesBounceThreshold: number = 0;
  protected twoPaddlesBounce: TwoPaddlesBounce = { count: 0, paddles: [] };

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

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.duration = this.noResetThreshold;
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    this.resetTrackers();
  }

  onPaddleBounce(game: Pong, args: { playerId: number }): void {
    const gameState = game.getState();

    // only track 3+ player games
    if (gameState.playerCount < 3) {
      this.resetTrackers();
      return;
    }

    this.ticks = this.duration;
    this.noPaddleBounceCount = 0;
    if (
      this.twoPaddlesBounce.paddles.length > 1 &&
      this.twoPaddlesBounce.paddles[
        this.twoPaddlesBounce.paddles.length - 1
      ] === args.playerId
    )
      return;

    if (this.twoPaddlesBounce.paddles.length < 2) {
      // build up the first two entries
      this.twoPaddlesBounce.paddles.push(args.playerId);
    } else if (
      this.twoPaddlesBounce.paddles[
        this.twoPaddlesBounce.paddles.length - 2
      ] === args.playerId
    ) {
      // hit matches the one two steps ago → a continued ABAB pattern
      this.twoPaddlesBounce.count++;
      this.twoPaddlesBounce.paddles.push(args.playerId);
    } else {
      // pattern broke (new paddle or 3rd paddle); start a new pair with the last hit + this one
      this.twoPaddlesBounce.count = 0;
      const last =
        this.twoPaddlesBounce.paddles[this.twoPaddlesBounce.paddles.length - 1];
      this.twoPaddlesBounce.paddles = [last, args.playerId];
    }

    if (this.twoPaddlesBounce.count >= this.twoPaddlesBounceThreshold) {
      this.nudgeBall(game);
      this.resetTrackers();
    }
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }): void {
    this.noPaddleBounceCount++;
    if (this.noPaddleBounceCount >= this.noPaddleBounceThreshold)
      this.deactivate(game);
  }

  onDeactivation(game: Pong): void {
    this.nudgeBall(game);
    this.resetTrackers();
    this.activate(game);
  }

  protected nudgeBall(game: Pong) {
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
    this.twoPaddlesBounce = {
      count: 0,
      paddles: [],
    };
  }
}
