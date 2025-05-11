import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierActivationMode, ModifierStatus } from "../../modifierBase";
import type { Pong } from "../pong";
import { fastifyInstance } from "../../../../app";

export class BlinkingBall extends TimeLimitedModifierBase {
  name = "blinkingBall";

  protected blinkInterval: number = 0;
  protected blinkDuration: number = 0;

  protected isVisible: boolean = false;

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.powerUps[this.name];

    this.configManager.registerPropertyConfig(
      "spawnWeight",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "duration",
      (_, context) => {
        const durationS = context.duration || defaultRegistry.durationS;
        return durationS * serverTickrateS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "activationMode",
      (_, context) => {
        const selfActivation =
          context.activationMode || defaultRegistry.selfActivation
            ? ModifierActivationMode.SELF
            : ModifierActivationMode.AUTO;
        return selfActivation;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig("blinkInterval", (_, context) => {
      const blinkIntervalS =
        context.blinkInterval || defaultRegistry.blinkIntervalS;
      return blinkIntervalS * serverTickrateS;
    });

    this.configManager.registerPropertyConfig(
      "blinkDuration",
      (_, context) => {
        const blinkDurationPercent =
          context.blinkDuration || defaultRegistry.blinkDurationPercent;
        return (blinkDurationPercent / 100.0) * this.blinkInterval;
      },
      undefined,
      ["blinkInterval"],
    );

    this.configManager.loadComplexConfigIntoContainer(customConfig || {}, this);
  }

  onUpdate(game: Pong): void {
    if (this.ticks < 0) {
      this.deactivate(game);
      return;
    }
    super.onUpdate(game);
    if (this.status !== ModifierStatus.ACTIVE) return;

    const gameState = game.getState();
    if (!(gameState.balls.length > 0)) {
      fastifyInstance.log.warn(
        `Can't make a ball blink if there's no balls: ${gameState.balls}`,
      );
      return;
    }

    if (
      !this.isVisible &&
      this.ticks % this.blinkInterval < this.blinkInterval - this.blinkDuration
    ) {
      gameState.balls.forEach((ball) => (ball.isVisible = true));
      this.isVisible = true;
    } else if (this.ticks % this.blinkInterval == 0) {
      gameState.balls.forEach((ball) => (ball.isVisible = false));
      this.isVisible = false;
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);

    game.getState().balls[0].isVisible = true;
    game.getModifierManager().deletePowerUp(this);
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    if (args.ballID <= 0)
      // -1: resetting all balls, 0: mainBall -> don't deactivate on non-main ball reset
      this.deactivate(game);
  }
}
