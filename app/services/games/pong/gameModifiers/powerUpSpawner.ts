import type { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierStatus } from "../../modifierBase";
import { Pong } from "../pong";
import { StrategyManager } from "../../../strategy/strategyManager";
import { type IPongPowerUpPositionSampler } from "../../../../types/strategy/IPongPowerUpPositionSampler";

export class PowerUpSpawner extends TimeLimitedModifierBase {
  name = "powerUpSpawner";

  protected meanDelay: number = 0;
  protected delaySpan: number = 0;
  protected positionSamplerStrategyManager: StrategyManager<
    IPongPowerUpPositionSampler,
    "samplePosition"
  >;
  protected positionSamplerStrategyName: string = "";

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

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

    const defaultConfig = {
      meanDelay: GAME_REGISTRY.pong.gameModifiers[this.name].meanDelayS,
      delaySpan: GAME_REGISTRY.pong.gameModifiers[this.name].delaySpanS,
      positionSamplerStrategyName:
        GAME_REGISTRY.pong.gameModifiers[this.name].positionSamplerStrategyName,
    };
    this.configManager.loadSimpleConfigIntoContainer(defaultConfig, this);

    // Apply custom configuration if provided
    if (customConfig)
      this.configManager.loadSimpleConfigIntoContainer(customConfig, this);

    this.positionSamplerStrategyManager = new StrategyManager(
      this.positionSamplerStrategyName,
      "pongPowerUpPositionSampler",
      "samplePosition",
    );
  }

  onGameStart(game: GameBase): void {
    this.activate(game);
  }

  onActivation(game: GameBase): void {
    this.duration = game
      .getRNG()
      .randomGaussian(this.meanDelay, this.delaySpan);

    // console.log(`Next powerUpSpawn in ${this.duration} ticks`);
  }

  onDeactivation(game: Pong): void {
    const sampledPosition: { x: number; y: number } =
      this.positionSamplerStrategyManager.executeStrategy(game);

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
    console.log("PowerUpSpawner PAUSED");
  }

  onResuming(game: GameBase): void {
    this.status = ModifierStatus.ACTIVE;
    console.log("PowerUpSpawner RESUMED");
  }
}
