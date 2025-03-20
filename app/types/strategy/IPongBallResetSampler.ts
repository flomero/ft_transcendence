import { Pong } from "../../services/games/pong/pong";

export interface IPongBallResetSampler {
  sampleDirection(game: Pong): {
    angularDirection: number;
    magnitude: number;
  };
}
