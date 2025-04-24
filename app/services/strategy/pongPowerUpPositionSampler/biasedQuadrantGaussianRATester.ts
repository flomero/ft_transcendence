import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import { Pong } from "../../games/pong/pong";
import { StrategyManager } from "../strategyManager";
import { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";

export class BiasedQuadrantGaussianRATester
  implements IPongPowerUpPositionSampler
{
  name = "biasedQuadrantGaussianRATester";

  protected stdAngularVariation: number = 0;
  protected angularOffset: number = 0;

  protected stdVelocityVariation: number = 0;
  protected maxVelocity: number = 0;

  protected playerSampler: StrategyManager<IPongPlayerSampler, "samplePlayer">;

  constructor() {
    this.stdAngularVariation =
      (STRATEGY_REGISTRY.pongBallResetSampler["biasedQuadrantGaussianRA"]
        .stdAngularVariationDeg *
        Math.PI) /
      180.0;
    this.angularOffset =
      (STRATEGY_REGISTRY.pongBallResetSampler["biasedQuadrantGaussianRA"]
        .angularOffsetDeg *
        Math.PI) /
      180.0;

    this.stdVelocityVariation =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedQuadrantGaussianRA"]
        .stdVelocityVariationPercent / 100.0;
    this.maxVelocity =
      STRATEGY_REGISTRY.pongBallResetSampler["biasedQuadrantGaussianRA"]
        .maxVelocityPercent / 100.0;

    this.playerSampler = new StrategyManager(
      STRATEGY_REGISTRY.pongBallResetSampler[
        "biasedQuadrantGaussianRA"
      ].playerSampler,
      "pongPlayerSampler",
      "samplePlayer",
    );
  }

  samplePosition(game: Pong): { x: number; y: number } {
    const rng = game.getRNG();
    let playerId = this.playerSampler.executeStrategy(game);

    // Allows to test w/o hvaing the ball moving
    const tmpBallSpeedWidthPercentS = 150;
    const stdVelocity =
      (game.getSettings().arenaWidth * (tmpBallSpeedWidthPercentS / 100.0)) /
      game.getServerTickrateS();

    // For test purposes
    const distanceFactor = 10;

    // Randomize a coefficient to the x direction, either -1 or 1 (left or right)
    const rndHorizontalDirection = playerId === 1;
    // Randomize a coefficient to the y direction, either -1 or 1 (up or down)
    const rndVerticalDirection = rng.randomInt(0, 1) === 1;

    // Generate a random angle following a Gaussian
    let alpha = rng.randomGaussian(
      this.angularOffset,
      this.stdAngularVariation,
    );

    const distance = Math.min(
      Math.max(
        stdVelocity - this.maxVelocity,
        rng.randomGaussian(stdVelocity, this.stdVelocityVariation),
      ),
      stdVelocity + this.maxVelocity,
    );

    // Flip along the x axis
    if (rndVerticalDirection) alpha = 2 * Math.PI - alpha;

    // Flip along the y axis
    if (rndHorizontalDirection) alpha = Math.PI - alpha;

    const x =
      game.getSettings().arenaWidth / 2.0 +
      distanceFactor * distance * Math.cos(alpha);
    const y =
      game.getSettings().arenaHeight / 2.0 +
      distanceFactor * distance * Math.sin(alpha);

    return { x: x, y: y };
  }
}
