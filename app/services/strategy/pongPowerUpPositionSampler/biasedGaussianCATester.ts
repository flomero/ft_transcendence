import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import type { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import type { Pong } from "../../games/pong/pong";

export class BiasedGaussianCATester implements IPongPowerUpPositionSampler {
  name = "biasedGaussianCATester";

  protected stdAngularVariationPercent: number = 0;
  protected angularOffset: number = 0;

  protected stdVelocityVariation: number = 0;
  protected maxVelocity: number = 0;
  protected minVelocity: number = 0;

  protected lastGoalBias: number = 0;

  constructor() {
    this.stdAngularVariationPercent =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .stdAngularVariationPercent / 100.0;

    this.angularOffset =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .angularOffsetPercent / 100.0;

    this.stdVelocityVariation =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .stdVelocityVariationPercent / 100.0;
    this.maxVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .maxVelocityPercent / 100.0;
    this.minVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .minVelocityPercent / 100.0;

    this.lastGoalBias =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedGaussianCA"]
        .lastGoalBiasPercent / 100.0;
  }

  samplePosition(game: Pong): { x: number; y: number } {
    const gameState = game.getState();
    const playerCount = gameState.playerCount;
    const halfDeltaAlpha = Math.PI / (2 * playerCount);

    const stdAngularVariation =
      this.stdAngularVariationPercent * halfDeltaAlpha;

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
      this.angularOffset * halfDeltaAlpha,
      stdAngularVariation,
    );
    // Create a symmetry
    alpha *= Math.pow(-1, rng.randomInt(0, 1));
    alpha += gameState.paddles[rndPlayer].alpha;

    // Allows to test w/o hvaing the ball moving
    const tmpBallSpeedWidthPercentS = 100;
    const stdVelocity =
      (game.getSettings().arenaWidth * (tmpBallSpeedWidthPercentS / 100.0)) /
      game.getServerTickrateS();

    // For test purposes
    const distanceFactor = 15;

    const distance = Math.min(
      Math.max(
        stdVelocity - this.minVelocity,
        rng.randomGaussian(stdVelocity, this.stdVelocityVariation),
      ),
      stdVelocity + this.maxVelocity,
    );

    const x =
      game.getSettings().arenaWidth / 2.0 +
      distanceFactor * distance * Math.cos(alpha);
    const y =
      game.getSettings().arenaHeight / 2.0 +
      distanceFactor * distance * Math.sin(alpha);

    return { x: x, y: y };
  }
}
