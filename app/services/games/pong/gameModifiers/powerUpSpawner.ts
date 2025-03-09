import { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { ModifierStatus } from "../../modifierBase";

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
    const arenaWidth =
      GAME_REGISTRY.pong.gameModes[game.gameData.gameModeName].arenaSettings
        .width;
    const arenaHeight =
      GAME_REGISTRY.pong.gameModes[game.gameData.gameModeName].arenaSettings
        .height;
    const defaultRadius =
      GAME_REGISTRY.pong.gameModes[game.gameData.gameModeName]
        .defaultPowerUpSettings.radius;
    const offset =
      GAME_REGISTRY.pong.gameModes[game.gameData.gameModeName].arenaSettings
        .wallHeight;

    const x = Math.min(
      Math.max(
        game.getRNG().randomGaussian(arenaWidth / 2.0, arenaWidth / 4.0),
        defaultRadius + offset,
      ),
      arenaWidth - (defaultRadius + offset),
    );

    const y = Math.min(
      Math.max(
        game.getRNG().randomGaussian(arenaHeight / 2.0, arenaHeight / 2.2),
        defaultRadius + offset,
      ),
      arenaHeight - (defaultRadius + offset),
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
    console.log(`PowerUpSpawner PAUSED`);
  }

  onResuming(game: GameBase): void {
    this.status = ModifierStatus.ACTIVE;
    console.log(`PowerUpSpawner RESUMED`);
  }
}
