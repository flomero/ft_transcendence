import { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import { Pong } from "../../games/pong/pong";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class FlowerGaussianCircularArena
  implements IPongPowerUpPositionSampler
{
  name = "flowerGaussianCircularArena";

  protected stdAngleDeviation: number = 0;
  protected baseRadiusFactor: number = 0;
  protected variationStrength: number = 0;
  protected stdDistanceDeviationPercent: number = 0;

  constructor() {
    // Controls general distance (angular) from randomly selected direction
    this.stdAngleDeviation =
      (STRATEGY_REGISTRY.pongPowerUpPositionSampler[this.name]
        .stdAngleDeviationDeg *
        Math.PI) /
      180.0;

    // Controls how far from the center it's generally generated
    this.baseRadiusFactor =
      STRATEGY_REGISTRY.pongPowerUpPositionSampler[this.name].baseRadiusFactor;
    // Controls general fluctuation between petal tip & center
    this.variationStrength =
      STRATEGY_REGISTRY.pongPowerUpPositionSampler[this.name].variationStrength;

    // Controls general distance from the petal shape line
    this.stdDistanceDeviationPercent =
      STRATEGY_REGISTRY.pongPowerUpPositionSampler[
        this.name
      ].stdDistanceDeviationPercent;
  }

  samplePosition(game: Pong): { x: number; y: number } {
    const playerCount = game.getExtraGameData().playerCount;
    const rng = game.getRNG();

    const totalOffset =
      game.getSettings().wallsHeight +
      game.getSettings().wallsOffset +
      game.getSettings().powerUpRadius;

    // Select a random player
    const rndDirection = rng.randomInt(0, playerCount - 1);
    const angleCenter = (rndDirection / playerCount) * 2 * Math.PI;

    // Angle follows a Gaussian distribution centered around the selected player
    const angle = rng.randomGaussian(angleCenter, this.stdAngleDeviation);

    // Distance follows a Gaussian distribution depending on the angle
    const radius =
      game.getSettings().arenaRadius || game.getSettings().arenaWidth / 2.0;
    const distanceMean =
      radius *
      (this.baseRadiusFactor +
        this.variationStrength * Math.cos(playerCount * angle));
    let distance = rng.randomGaussian(
      distanceMean,
      radius * (this.stdDistanceDeviationPercent / 100),
    );

    distance = Math.min(Math.max(totalOffset, distance), radius - totalOffset);

    // Convert polar coordinates to Cartesian
    const x = radius + distance * Math.cos(angle);
    const y = radius + distance * Math.sin(angle);

    return { x, y };
  }
}
