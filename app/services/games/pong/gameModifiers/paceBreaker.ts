import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Pong } from "../pong";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GameBase } from "../../gameBase";

export class PaceBreaker extends TimeLimitedModifierBase {
  name = "paceBreaker";

  protected noResetThreshold: number = 0;
  protected noPaddleBounceThreshold: number = 0;
  protected noPaddleBounceCount: number = 0;

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

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.duration = this.noResetThreshold;
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    this.ticks = this.duration;
    this.noPaddleBounceCount = 0;
  }

  onPaddleBounce(game: Pong, args: { playerId: number }): void {
    this.ticks = this.duration;
    this.noPaddleBounceCount = 0;
  }

  onWallBounce(game: Pong, args: { wallID: number; ballID: number }): void {
    this.noPaddleBounceCount++;
    if (this.noPaddleBounceCount >= this.noPaddleBounceThreshold)
      this.deactivate(game);
  }

  onDeactivation(game: Pong): void {
    this.nudgeBall(game);
    this.noPaddleBounceCount = 0;
    this.activate(game);
  }

  onUpdate(game: GameBase): void {
    super.onUpdate(game);

    if (this.ticks % 30 === 0)
      console.log(
        `${this.ticks} / ${this.duration}  |  ${this.noPaddleBounceCount} / ${this.noPaddleBounceThreshold}`,
      );
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
}
