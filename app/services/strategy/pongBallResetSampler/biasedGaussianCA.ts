import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { Pong } from "../../games/pong/pong";
import { IPongBallResetSampler } from "../../../types/strategy/IPongBallResetSampler";

export class BiasedGaussianCA implements IPongBallResetSampler {
  name = "biasedGaussianCA";

  protected stdAngularVariationPercent: number = 0;

  protected stdVelocityVariation: number = 0;
  protected maxVelocity: number = 0;

  protected lastGoalBias: number = 0;

  constructor() {
    this.stdAngularVariationPercent =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdAngularVariationPercent / 100.0;

    this.stdVelocityVariation =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdVelocityVariationPercent / 100.0;
    this.maxVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].maxVelocityPercent /
      100.0;

    this.lastGoalBias =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].lastGoalBiasPercent /
      100.0;
  }

  sampleDirection(game: Pong): { angularDirection: number; magnitude: number } {
    const playerCount = game.getExtraGameData().playerCount;
    const stdAngularVariation =
      (this.stdAngularVariationPercent * Math.PI) / (2.0 * playerCount);

    const rng = game.getRNG();
    let playerId = game.getExtraGameData().lastGoal;
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

    console.log(`rnd: ${rnd}\nrndPlayer: ${rndPlayer}`);

    const ballSpeedWidthPercentS = game.getSettings().ballSpeedWidthPercentS;
    const stdVelocity =
      (game.getSettings().arenaWidth * (ballSpeedWidthPercentS / 100.0)) /
      game.getServerTickrateS();

    // Generate a random angle following a Gaussian
    let alpha = rng.randomGaussian(0, stdAngularVariation);

    alpha += game.getGameObjects().paddles[rndPlayer].alpha;

    const distance = Math.min(
      Math.max(
        stdVelocity - this.maxVelocity,
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
