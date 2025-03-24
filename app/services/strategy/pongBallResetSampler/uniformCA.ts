import { IPongBallResetSampler } from "../../../types/strategy/IPongBallResetSampler";
import { Pong } from "../../games/pong/pong";

export class UniformCA implements IPongBallResetSampler {
  name = "uniformCA";

  sampleDirection(game: Pong): { angularDirection: number; magnitude: number } {
    const radius =
      game.getSettings().arenaRadius || game.getSettings().arenaWidth / 2.0;

    const powerUpRadius = game.getSettings().powerUpRadius;
    const offset = game.getSettings().wallsHeight;

    const alpha = game.getRNG().random() * Math.PI * 2.0;

    const distance = game.getRNG().random() * (radius - powerUpRadius - offset);

    return {
      angularDirection: alpha,
      magnitude: distance,
    };
  }
}
