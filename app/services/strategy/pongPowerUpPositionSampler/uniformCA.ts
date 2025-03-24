import { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import { Pong } from "../../games/pong/pong";

export class UniformCA implements IPongPowerUpPositionSampler {
  name = "uniformCA";

  samplePosition(game: Pong): { x: number; y: number } {
    const radius =
      game.getSettings().arenaRadius || game.getSettings().arenaWidth / 2.0;

    const powerUpRadius = game.getSettings().powerUpRadius;
    const offset = game.getSettings().wallsHeight;

    const alpha = game.getRNG().random() * Math.PI * 2.0;
    const ca = Math.cos(alpha);
    const sa = Math.sin(alpha);

    const distance = game.getRNG().random() * (radius - powerUpRadius - offset);

    const x = Math.min(
      Math.max(radius + distance * ca, powerUpRadius + offset),
      2 * radius - (powerUpRadius + offset),
    );

    const y = Math.min(
      Math.max(radius + distance * sa, powerUpRadius + offset),
      2 * radius - (powerUpRadius + offset),
    );

    return { x: x, y: y };
  }
}
