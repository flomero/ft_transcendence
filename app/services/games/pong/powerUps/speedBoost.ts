import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Pong } from "../pong";

export class SpeedBoost extends TimeLimitedModifierBase {
  name = "speedBoost";

  private strength: number = 0;

  private rampUpFrequency: number; // Increment every X ticks
  private rampUpStrength: number; // Increment by X every increment

  constructor() {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    // duration
    const durationS = GAME_REGISTRY.pong.powerUps[this.name].durationS;
    this.duration = durationS * serverTickrateS;

    // spawnWeight
    this.spawnWeight = GAME_REGISTRY.pong.powerUps[this.name].spawnWeight;

    // rampUpFrequency
    const rampUpFrequencyS =
      GAME_REGISTRY.pong.powerUps[this.name].rampUpFrequencyS;
    this.rampUpFrequency = (this.duration * durationS) / rampUpFrequencyS;

    // rampUpStrength
    const totalRampUpStrength =
      GAME_REGISTRY.pong.powerUps[this.name].totalRampUpStrength;
    this.rampUpStrength =
      (totalRampUpStrength * this.rampUpFrequency) / this.duration;
  }

  onUpdate(game: Pong): void {
    super.onUpdate(game);

    if (this.ticks % this.rampUpFrequency == 0) {
      this.strength += this.rampUpStrength;

      if (!(game.getGameObjects().balls.length > 0)) {
        console.log(
          `Cna't speed up if there's no balls: ${game.getGameObjects().balls}`,
        );
        return;
      }

      game.editGameObject(game.getGameObjects().balls[0], {
        property: "speed",
        editor: (speed) => speed * (1 + this.strength),
      });
    }
  }
}
