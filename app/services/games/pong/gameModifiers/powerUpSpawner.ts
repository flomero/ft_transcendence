import type { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierStatus } from "../../modifierBase";
import type { Pong } from "../pong";
import { StrategyManager } from "../../../strategy/strategyManager";
import type { IPongPowerUpPositionSampler } from "../../../../types/strategy/IPongPowerUpPositionSampler";
import { fastifyInstance } from "../../../../app";

export class PowerUpSpawner extends TimeLimitedModifierBase {
  name = "powerUpSpawner";

  protected meanDelay: number = 0;
  protected delaySpan: number = 0;
  protected positionSampler: StrategyManager<
    IPongPowerUpPositionSampler,
    "samplePosition"
  >;
  protected positionSamplerStrategyName: string = "";

  protected mayhemChance: number = 0.01; // <-- if triggered spawn EVERY powerUps available.

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.gameModifiers[this.name];

    // Register transformations for properties
    this.configManager.registerPropertyConfig(
      "meanDelay",
      (meanDelayS) => meanDelayS * serverTickrateS,
      (meanDelay) => meanDelay / serverTickrateS,
    );

    this.configManager.registerPropertyConfig(
      "delaySpan",
      (delaySpanS) => delaySpanS * serverTickrateS,
      (delaySpan) => delaySpan / serverTickrateS,
    );

    this.configManager.registerPropertyConfig(
      "positionSamplerStrategyName",
      (_, context) =>
        context.positionSamplerStrategyName || defaultRegistry.positionSampler,
    );

    this.configManager.registerPropertyConfig("mayhemChance", (_, context) => {
      const mayhemChance =
        context.mayhemChance || defaultRegistry.mayhemChancePercent;
      return mayhemChance / 100.0;
    });

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach(([key, value]) => {
        mergedConfig[key] = value;
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.positionSampler = new StrategyManager(
      this.positionSamplerStrategyName,
      "pongPowerUpPositionSampler",
      "samplePosition",
    );
  }

  onGameStart(game: Pong): void {
    this.activate(game);
  }

  onActivation(game: Pong): void {
    this.duration = Math.max(
      0,
      game.getRNG().randomGaussian(this.meanDelay, this.delaySpan),
    );
  }

  onDeactivation(game: Pong): void {
    const isMayhem = game.getRNG().random() < this.mayhemChance;
    if (isMayhem) {
      this.handleMayhem(game);
      return;
    }

    const sampledPosition: { x: number; y: number } =
      this.positionSampler.executeStrategy(game);

    const spawned = game
      .getModifierManager()
      .spawnRandomPowerUp(game.getRNG(), sampledPosition);

    this.activate(game);
    if (!spawned) this.pause(game);
  }

  onCDFComputation(game: GameBase): void {
    if (game.getModifierManager().getCDF().length > 0) this.resume(game);
  }

  onPausing(game: GameBase): void {
    fastifyInstance.log.debug("PowerUpSpawner PAUSED");
  }

  onResuming(game: GameBase): void {
    this.status = ModifierStatus.ACTIVE;
    fastifyInstance.log.debug("PowerUpSpawner RESUMED");
  }

  protected handleMayhem(game: Pong) {
    const availablePowerUps = game.getModifierManager().getAvailablePowerUps();

    availablePowerUps.forEach((powerUpName) => {
      const rndPosition = this.positionSampler.executeStrategy(game);

      game.getModifierManager().spawnPowerUp(powerUpName, rndPosition);
    });
  }
}
