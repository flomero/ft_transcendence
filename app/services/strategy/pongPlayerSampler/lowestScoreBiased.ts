import type { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import type { Pong } from "../../games/pong/pong";

export class LowestScoreBiased implements IPongPlayerSampler {
  name = "lowestScoreBiased";

  samplePlayer(game: Pong): number {
    // Make an array of ids of player's that aren't eliminated
    const scores = game.getState().scores;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const weights = scores
      .filter((_, id) => game.getState().results[id] === 0)
      .map((score) => min + max - score);

    const rndIndex = game.getRNG().randomWeighted(weights);

    return rndIndex;
  }
}
