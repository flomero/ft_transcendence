import type { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import type { Pong } from "../../games/pong/pong";

export class HighestScoreBiased implements IPongPlayerSampler {
  name = "highestScoreBiased";

  samplePlayer(game: Pong): number {
    // Make an array of ids of player's that aren't eliminated
    const scores = game.getState().scores;
    const weights = scores.filter((_, id) => {
      return game.getState().results[id] === 0;
    });

    const rndIndex = game.getRNG().randomWeighted(weights);

    return rndIndex;
  }
}
