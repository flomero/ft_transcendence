import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { type Pong } from "../pong";
import { ModifierActivationMode } from "../../modifierBase";

export class SpeedBoost extends TimeLimitedModifierBase {
  name = "speedBoost";

  private strength: number = 0;

  private rampUpFrequency: number; // Increment every X ticks
  private rampUpStrength: number; // Increment by X every increment

  private initialSpeed: number = 0;

  constructor() {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    // duration
    const durationS = GAME_REGISTRY.pong.powerUps[this.name].durationS;
    this.duration = durationS * serverTickrateS;

    // spawnWeight
    this.spawnWeight = GAME_REGISTRY.pong.powerUps[this.name].spawnWeight;

    // selfActivation
    if (GAME_REGISTRY.pong.powerUps[this.name].selfActivation)
      this.activationMode = ModifierActivationMode.SELF;

    // rampUpFrequency
    const rampUpFrequencyS =
      GAME_REGISTRY.pong.powerUps[this.name].rampUpFrequencyS;
    this.rampUpFrequency = (this.duration * rampUpFrequencyS) / durationS;

    // rampUpStrength
    const totalRampUpStrength =
      GAME_REGISTRY.pong.powerUps[this.name].totalRampUpStrength;
    this.rampUpStrength =
      (totalRampUpStrength * this.rampUpFrequency) / this.duration;
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
