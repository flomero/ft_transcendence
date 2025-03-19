import type { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierStatus } from "../../modifierBase";
import { Pong } from "../pong";

export class PowerUpSpawner extends TimeLimitedModifierBase {
  name = "powerUpSpawner";

  protected meanDelay: number = 0;
  protected delaySpan: number = 0;

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
    };
    this.configManager.loadSimpleConfigIntoContainer(defaultConfig, this);

    // Apply custom configuration if provided
    if (customConfig)
      this.configManager.loadSimpleConfigIntoContainer(customConfig, this);
  }

  onGameStart(game: GameBase): void {
    this.activate(game);
  }

  onActivation(game: GameBase): void {
    this.duration = game
      .getRNG()
      .randomGaussian(this.meanDelay, this.delaySpan);

    console.log(`Next powerUpSpawn in ${this.duration} ticks`);
  }

  onDeactivation(game: Pong): void {
    const halfWidth = game.getSettings().arenaWidth / 2.0;
    const halfHeight = game.getSettings().arenaHeight / 2.0;

    const defaultRadius = game.getSettings().powerUpRadius;

    const offset = game.getSettings().wallsHeight;

    const x = Math.min(
      Math.max(
        game.getRNG().randomGaussian(halfWidth, halfWidth / 2.0),
        defaultRadius + offset,
      ),
      halfWidth * 2.0 - (defaultRadius + offset),
    );

    const y = Math.min(
      Math.max(
        game.getRNG().randomGaussian(halfHeight, halfHeight / 1.05),
        defaultRadius + offset,
      ),
      halfHeight * 2.0 - (defaultRadius + offset),
    );

    const spawned = game
      .getModifierManager()
      .spawnRandomPowerUp(game.getRNG(), [x, y]);

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
