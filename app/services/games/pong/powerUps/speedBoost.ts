import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Pong } from "../pong";
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

    this.initialSpeed = game.getGameObjects()?.balls[0].speed;
  }

  onUpdate(game: Pong): void {
    super.onUpdate(game);

    if (this.ticks % this.rampUpFrequency == 0) {
      this.strength += this.rampUpStrength;

      if (!(game.getGameObjects().balls.length > 0)) {
        console.log(
          `Can't speed up if there's no balls: ${game.getGameObjects().balls}`,
        );
        return;
      }

      game.editGameObject(game.getGameObjects().balls[0], {
        property: "speed",
        editor: (speed) => this.initialSpeed * (1 + this.strength),
      });
    }
  }

  onDeactivation(game: Pong): void {
    super.onDeactivation(game);
    game.getModifierManager().deletePowerUp(this);
  }
}
