import { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import { Pong } from "../../games/pong/pong";

export class UniformComplete implements IPongPlayerSampler {
  name = "uniformComplete";

  samplePlayer(game: Pong): number {
    const rndPlayer = game
      .getRNG()
      .randomInt(0, game.getState().playerCount - 1);

    return rndPlayer;
  }
}
