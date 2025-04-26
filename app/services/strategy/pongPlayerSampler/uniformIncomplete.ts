import type { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import type { Pong } from "../../games/pong/pong";

export class UniformIncomplete implements IPongPlayerSampler {
  name = "uniformIncomplete";

  samplePlayer(game: Pong): number {
    // Make an array of ids of player's that aren't eliminated
    const survivors = game
      .getState()
      .results.filter((result) => result === 0)
      .map((_, id) => id);

    const rndIndex = game.getRNG().randomInt(0, survivors.length - 1);

    return survivors[rndIndex];
  }
}
