import type { Pong } from "../../services/games/pong/pong";

export interface IPongPowerUpPositionSampler {
  samplePosition(game: Pong): { x: number; y: number };
}
