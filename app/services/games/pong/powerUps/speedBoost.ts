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

    this.registerPropertyConfig("spawnWeight", (value) => value, undefined);

    // Only register transformations for specific properties we want to modify
    this.registerPropertyConfig(
      "duration",
      (_, context) => {
        const durationS = context.duration || defaultRegistry.durationS;
        return durationS * serverTickrateS;
      },
      undefined,
    );

    this.registerPropertyConfig(
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

    // Register complex derived properties with clear dependencies
    this.registerPropertyConfig(
      "rampUpFrequency",
      (_, context) => {
        const rampUpFrequencyS =
          context.rampUpFrequency || defaultRegistry.rampUpFrequencyS;
        return serverTickrateS * rampUpFrequencyS;
      },
      undefined,
    );

    this.registerPropertyConfig(
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

    // Apply custom configuration if provided
    if (customConfig) {
      // Map property names if needed
      const mappedConfig: Record<string, any> = {};

      // Handle direct overrides
      for (const [key, value] of Object.entries(customConfig)) {
        mappedConfig[key] = value;
      }

      // Apply the custom configuration
      this.loadComplexConfig(mappedConfig);
    }
  }

  onActivation(game: Pong): void {
    super.onActivation(game);

    const gameObjects = game.getGameObjects();
    if (gameObjects.balls.length > 0) {
      this.initialSpeed = gameObjects.balls[0].speed;
    }
  }

  async onUpdate(game: Pong): Promise<void> {
    super.onUpdate(game);

    if (this.ticks % this.rampUpFrequency == 0) {
      this.strength += this.rampUpStrength;

      const gameObjects = game.getGameObjects();
      if (!(gameObjects.balls.length > 0)) {
        console.log(`Can't speed up if there's no balls: ${gameObjects.balls}`);
        return;
      }

      const newSpeed = this.initialSpeed * (1 + this.strength);

      game.getGameObjects().balls[0].speed = newSpeed;
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);

    // Reset ball speed back to initial when deactivating
    const gameObjects = game.getGameObjects();
    if (gameObjects.balls.length > 0)
      game.getGameObjects().balls[0].speed = this.initialSpeed;

    game.getModifierManager().deletePowerUp(this);
  }
}
