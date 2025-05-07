import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import type { Pong } from "../pong";
import { ModifierActivationMode } from "../../modifierBase";

export class SpeedBoost extends TimeLimitedModifierBase {
  name = "speedBoost";

  protected strength: number = 0;

  protected rampUpFrequency: number = 0; // Increment every X ticks
  protected rampUpStrengthFactor: number = 0; // Increment by X every increment

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

    this.configManager.registerPropertyConfig(
      "rampUpFrequency",
      (_, context) => {
        const rampUpFrequencyS =
          context.rampUpFrequency || defaultRegistry.rampUpFrequencyS;
        return serverTickrateS * rampUpFrequencyS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "rampUpStrengthFactor",
      (_, context) => {
        const rampUpStrengthPercent =
          context.rampUpStrengthFactor || defaultRegistry.rampUpStrengthPercent;
        return rampUpStrengthPercent / 100;
      },
      undefined,
    );

    this.configManager.loadComplexConfigIntoContainer(customConfig || {}, this);
  }

  onUpdate(game: Pong): void {
    if (this.ticks < 0) {
      this.deactivate(game);
      return;
    }
    super.onUpdate(game);

    if (this.ticks % this.rampUpFrequency == 0) {
      const gameState = game.getState();
      if (!(gameState.balls.length > 0)) {
        console.log(`Can't speed up if there's no balls: ${gameState.balls}`);
        return;
      }

      gameState.balls[0].speed +=
        this.rampUpStrengthFactor * gameState.balls[0].speed;
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);
    game.getModifierManager().deletePowerUp(this);
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    if (args.ballID <= 0)
      // -1: resetting all balls, 0: mainBall -> don't deactivate on non-main ball reset
      this.deactivate(game);
  }
}
