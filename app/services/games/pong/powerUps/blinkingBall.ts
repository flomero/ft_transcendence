import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierActivationMode } from "../../modifierBase";
import { type Pong } from "../pong";

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
    super.onUpdate(game);

    const gameState = game.getState();
    if (!(gameState.balls.length > 0)) {
      console.log(
        `Can't make a ball blink if there's no balls: ${gameState.balls}`,
      );
      return;
    }

    if (
      !this.isVisible &&
      this.ticks % this.blinkInterval < this.blinkInterval - this.blinkDuration
    ) {
      gameState.balls[0].isVisible = true;
      this.isVisible = true;
    }

    if (this.ticks % this.blinkInterval == 0) {
      gameState.balls[0].isVisible = false;
      this.isVisible = false;
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);

    game.getState().balls[0].isVisible = true;
    game.getModifierManager().deletePowerUp(this);
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    this.deactivate(game);
  }
}
