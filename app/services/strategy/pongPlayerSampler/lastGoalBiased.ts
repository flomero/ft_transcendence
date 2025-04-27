import type { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import type { Pong } from "../../games/pong/pong";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class LastGoalBiased implements IPongPlayerSampler {
  name = "lastGoalBiased";

  protected lastGoalBias: number = 0;

  constructor(lastGoalBiasPercent: number) {
    this.lastGoalBias =
      STRATEGY_REGISTRY.pongPlayerSampler[this.name].lastGoalBiasPercent /
      100.0;
  }

  samplePlayer(game: Pong): number {
    const gameState = game.getState();
    // Make an array of ids of player's that aren't eliminated
    let lastGoal: number = gameState.lastGoal;
    if (lastGoal < 0)
      lastGoal = game.getRNG().randomInt(0, gameState.playerCount - 1);

    // let x be the chance a player has to be selected.
    //   lastGoal has x * (1 + lastGoalBias)
    // Total = 1 -> x * (playerCount - 1) + x * (1 + lastGoalBias) = 1
    //   -> x = 1 / (playerCount + lastGoalBias)
    const probability: number = 1 / (gameState.playerCount + this.lastGoalBias);

    const weights: number[] = (
      Array.from({ length: gameState.playerCount }) as number[]
    ).fill(probability);
    weights[lastGoal] += probability * this.lastGoalBias;
    const rndID = game.getRNG().randomWeighted(weights);

    return rndID;
  }
}
