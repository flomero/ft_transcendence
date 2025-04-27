import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import type { Pong } from "../../games/pong/pong";
import type { IPongBallResetSampler } from "../../../types/strategy/IPongBallResetSampler";

export class BiasedGaussianCA implements IPongBallResetSampler {
  name = "biasedGaussianCA";

  protected stdAngularVariationPercent: number = 0;
  protected angularOffset: number = 0;

  protected stdVelocityVariation: number = 0;
  protected maxVelocity: number = 0;
  protected minVelocity: number = 0;

  protected lastGoalBias: number = 0;

  constructor() {
    this.stdAngularVariationPercent =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdAngularVariationPercent / 100.0;

    this.angularOffset =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].angularOffsetPercent /
      100.0;

    this.stdVelocityVariation =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdVelocityVariationPercent / 100.0;
    this.maxVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].maxVelocityPercent /
      100.0;
    this.minVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].minVelocityPercent /
      100.0;

    this.lastGoalBias =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].lastGoalBiasPercent /
      100.0;
  }

  sampleDirection(game: Pong): { angularDirection: number; magnitude: number } {
    const gameState = game.getState();
    const playerCount = gameState.playerCount;
    const deltaAlpha = Math.PI / playerCount;

    const stdAngularVariation =
      (this.stdAngularVariationPercent * deltaAlpha) / 2.0;

    const rng = game.getRNG();

    // -- Select a random player -- //
    let playerId = gameState.lastGoal;
    if (playerId === -1)
      // If no one took a goal yet (ball out of bounds ?) then randomize the bias
      playerId = rng.randomInt(0, playerCount - 1);

    // playerId has lastGoalBias less % chance to be selected
    //   => rest:      x %
    //   => playerId:  ((1 - lastGoalBias) * x) %
    // Total: (playerCount - 1) * x + lastGoalBias * x = 1
    //   => x = 1 / (playerCount - 1 + lastGoalBias)
    const restChance = 1.0 / (playerCount - this.lastGoalBias);
    const pdf = new Array<number>(playerCount).fill(restChance);
    pdf[playerId] = (1 - this.lastGoalBias) * restChance;

    const cdf: number[] = [];
    let cumul = 0;
    for (const density of pdf) {
      cumul += density;
      cdf.push(cumul);
    }

    const rnd = rng.random();
    const rndPlayer = cdf.findIndex((value) => rnd <= value);
    // -------------------------- //

    // Generate a random angle following a Gaussian
    let alpha = rng.randomGaussian(
      this.angularOffset * deltaAlpha,
      stdAngularVariation,
    );
    // Create a symmetry
    alpha *= Math.pow(-1, rng.randomInt(0, 1));
    alpha += gameState.paddles[rndPlayer].alpha;

    const ballSpeedWidthPercentS = game.getSettings().ballSpeedWidthPercentS;
    const stdVelocity =
      (game.getSettings().arenaWidth * (ballSpeedWidthPercentS / 100.0)) /
      game.getServerTickrateS();

    const distance = Math.min(
      Math.max(
        stdVelocity - this.minVelocity,
        rng.randomGaussian(stdVelocity, this.stdVelocityVariation),
      ),
      stdVelocity + this.maxVelocity,
    );

    return {
      angularDirection: alpha,
      magnitude: distance,
    };
  }
}
