import { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import { Pong } from "../../games/pong/pong";

export class ElipticGaussianRectangularArena
  implements IPongPowerUpPositionSampler
{
  name = "elipticGaussianRectangularArena";

  samplePosition(game: Pong): { x: number; y: number } {
    const width = game.getSettings().arenaWidth;
    const height = game.getSettings().arenaHeight;

    const powerUpRadius = game.getSettings().powerUpRadius;
    const offset = game.getSettings().wallsHeight;

    const x = Math.min(
      Math.max(
        game.getRNG().randomGaussian(width / 2.0, width / 4.0),
        powerUpRadius + offset,
      ),
      width - (powerUpRadius + offset),
    );

    const y = Math.min(
      Math.max(
        game.getRNG().randomGaussian(height / 2.0, height / 4.0),
        powerUpRadius + offset,
      ),
      height - (powerUpRadius + offset),
    );

    return { x: x, y: y };
  }
}
