import type { Pong } from "../../services/games/pong/pong";

export interface IPongPlayerSampler {
  samplePlayer(game: Pong): number;
}
