import type { IPongPlayerSampler } from "../../../types/strategy/IPongPlayerSampler";
import type { IPongPowerUpPositionSampler } from "../../../types/strategy/IPongPowerUpPositionSampler";
import type { Pong } from "../../games/pong/pong";
import { StrategyManager } from "../strategyManager";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class FlowerGaussianCA implements IPongPowerUpPositionSampler {
  name = "flowerGaussianCA";

  protected playerSampler: StrategyManager<IPongPlayerSampler, "samplePlayer">;

  protected stdAngleDeviation: number = 0;
  protected baseRadiusFactor: number = 0;
  protected variationStrength: number = 0;
  protected stdDistanceDeviationPercent: number = 0;

  constructor() {
    this.playerSampler = new StrategyManager(
      STRATEGY_REGISTRY.pongPowerUpPositionSampler[this.name].playerSampler,
      "pongPlayerSampler",
      "samplePlayer",
    );

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
    const gameState = game.getState();
    const playerCount = gameState.playerCount;
    const rng = game.getRNG();

    const totalOffset =
      game.getSettings().wallsHeight +
      game.getSettings().wallsOffset +
      game.getSettings().powerUpRadius;

    // Select a random player
    const rndPlayer = this.playerSampler.executeStrategy(game);
    const angleCenter = gameState.paddles[rndPlayer].alpha;

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
