import { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";

export class PowerUpSpawner extends TimeLimitedModifierBase {
  name = "powerUpSpawner";

  private meanDelay: number;
  private delaySpan: number;

  constructor() {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const meanDelayS = GAME_REGISTRY.pong.gameModifiers[this.name].meanDelayS;
    const delaySpanS = GAME_REGISTRY.pong.gameModifiers[this.name].delaySpanS;

    this.meanDelay = meanDelayS * serverTickrateS;
    this.delaySpan = delaySpanS * serverTickrateS;
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

  onDeactivation(game: GameBase): void {
    // placeholder
    // game.spawnRandomPowerUp()

    this.activate(game);
  }
}
