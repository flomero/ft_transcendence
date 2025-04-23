import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { type Pong } from "../pong";
import { ModifierActivationMode } from "../../modifierBase";

export class SpeedBoost extends TimeLimitedModifierBase {
  name = "speedBoost";

  protected strength: number = 0;

  protected rampUpFrequency: number = 0; // Increment every X ticks
  protected rampUpStrength: number = 0; // Increment by X every increment

  protected initialSpeed: number = 0;

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
      "rampUpStrength",
      (_, context) => {
        const totalRampUpStrength =
          context.rampUpStrength || defaultRegistry.totalRampUpStrength;
        const rampUpFrequency = this.rampUpFrequency;
        const duration = this.duration;
        return (totalRampUpStrength * rampUpFrequency) / duration;
      },
      undefined,
      ["rampUpFrequency", "duration"],
    );

    this.configManager.loadComplexConfigIntoContainer(customConfig || {}, this);
  }

  onActivation(game: Pong): void {
    super.onActivation(game);

    const gameState = game.getState();
    if (gameState.balls.length > 0) {
      this.initialSpeed = gameState.balls[0].speed;
    }
  }

  onUpdate(game: Pong): void {
    super.onUpdate(game);

    if (this.ticks % this.rampUpFrequency == 0) {
      this.strength += this.rampUpStrength;

      const gameState = game.getState();
      if (!(gameState.balls.length > 0)) {
        console.log(`Can't speed up if there's no balls: ${gameState.balls}`);
        return;
      }

      const newSpeed = this.initialSpeed * (1 + this.strength);

      gameState.balls[0].speed = newSpeed;
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);

    // Reset ball speed back to initial when deactivating
    const gameState = game.getState();
    if (gameState.balls.length > 0 && this.ticks === 0)
      gameState.balls[0].speed = this.initialSpeed;

    game.getModifierManager().deletePowerUp(this);
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    this.deactivate(game);
  }
}
