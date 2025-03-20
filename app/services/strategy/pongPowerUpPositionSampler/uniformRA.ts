import { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import { Pong } from "../../games/pong/pong";

export class UniformRA implements IPongPowerUpPositionSampler {
  name = "uniformRA";

  samplePosition(game: Pong): { x: number; y: number } {
    const width = game.getSettings().arenaWidth;
    const height = game.getSettings().arenaHeight;

    const powerUpRadius = game.getSettings().powerUpRadius;
    const offset = game.getSettings().wallsHeight;

    const x = Math.min(
      Math.max(game.getRNG().random() * width, powerUpRadius + offset),
      width - (powerUpRadius + offset),
    );

    const y = Math.min(
      Math.max(game.getRNG().random() * height, powerUpRadius + offset),
      height - (powerUpRadius + offset),
    );

    return { x: x, y: y };
  }
}
