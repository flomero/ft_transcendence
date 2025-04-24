import { IPongBallResetSampler } from "../../../types/strategy/IPongBallResetSampler";
import { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import { Pong } from "../../games/pong/pong";
import { StrategyManager } from "../strategyManager";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class BiasedQuadrantGaussianRA implements IPongBallResetSampler {
  name = "biasedQuadrantGaussianRA";

  protected stdAngularVariation: number = 0;
  protected angularOffset: number = 0;

  protected stdVelocityVariation: number = 0;
  protected maxVelocity: number = 0;

  protected lastGoalBias: number = 0;
  protected playerSampler: StrategyManager<IPongPlayerSampler, "samplePlayer">;

  constructor() {
    this.stdAngularVariation =
      (STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdAngularVariationDeg *
        Math.PI) /
      180.0;
    this.angularOffset =
      (STRATEGY_REGISTRY.pongBallResetSampler[this.name].angularOffsetDeg *
        Math.PI) /
      180.0;

    this.stdVelocityVariation =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name]
        .stdVelocityVariationPercent / 100.0;
    this.maxVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].maxVelocityPercent /
      100.0;

    this.playerSampler = new StrategyManager(
      STRATEGY_REGISTRY.pongBallResetSampler[this.name].playerSampler,
      "pongPlayerSampler",
      "samplePlayer",
    );
  }

  sampleDirection(game: Pong): { angularDirection: number; magnitude: number } {
    const rng = game.getRNG();
    let playerId = this.playerSampler.executeStrategy(game);

    const ballSpeedWidthPercentS = game.getSettings().ballSpeedWidthPercentS;
    const stdVelocity =
      (game.getSettings().arenaWidth * (ballSpeedWidthPercentS / 100.0)) /
      game.getServerTickrateS();

    // Randomize a coefficient to the x direction, either -1 or 1 (left or right)
    const rndHorizontalDirection = playerId === 1;
    // Randomize a coefficient to the y direction, either -1 or 1 (up or down)
    const rndVerticalDirection = rng.randomInt(0, 1) === 1;

    // Generate a random angle following a Gaussian
    let alpha = rng.randomGaussian(
      this.angularOffset,
      this.stdAngularVariation,
    );

    // Flip along the x axis
    if (rndVerticalDirection) alpha = 2 * Math.PI - alpha;

    // Flip along the y axis
    if (rndHorizontalDirection) alpha = Math.PI - alpha;

    const magnitude = Math.min(
      Math.max(
        stdVelocity - this.maxVelocity,
        rng.randomGaussian(stdVelocity, this.stdVelocityVariation),
      ),
      stdVelocity + this.maxVelocity,
    );

    return {
      angularDirection: alpha,
      magnitude: magnitude,
    };
  }
}
