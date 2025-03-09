import { RNG } from "./rng";
import { ModifierManager } from "./modifierManager";

export enum GameStatus {
  CREATED,
  RUNNING,
  PAUSED,
  FINISHED,
}

export abstract class GameBase {
  protected matchId: string = "undefined";

  protected lastUpdateTime: number;
  protected startTimeMs: number;
  protected serverTickrateS: number = 20;

  protected status: GameStatus = GameStatus.CREATED;

  protected rng: RNG;
  protected modifierManager: ModifierManager;

  constructor(public gameData: Record<string, any>) {
    this.lastUpdateTime = Date.now();
    this.startTimeMs = Date.now();

    console.log(gameData);

    this.rng = new RNG();
    this.modifierManager = new ModifierManager(this);
  }

  /**
   * Advances the game by 1 tick.
   */
  abstract update(): Promise<void>;

  /**
   * Starts the game.
   */
  startGame(): void {
    this.status = GameStatus.RUNNING;
    console.log("Game started");
    this.modifierManager.trigger("onGameStart");
  }

  /**
   * Returns a snapshot of the current game state.
   */
  getStateSnapshot(): Record<string, any> {
    return {
      timestamp: this.lastUpdateTime,
    };
  }

  /**
   * Restores a game state snapshot.
   */
  abstract loadStateSnapshot(snapshot: Record<string, any>): void;

  /**
   * Handles a client action.
   */
  async handleAction(action: Record<string, any>): Promise<void> {
    // Implementation here...
  }

  /**
   * Spawns a power-up at the designated position.
   * @param position A tuple with the x and y coordinates.
   * @param rng A random number generator instance.
   */
  // abstract spawnPowerUp(position: [number, number], rng: RNG): void;
  // spawnPowerUp(
  //   position: [number, number],
  //   rng: { random: () => number },
  // ): void {
  //   if (
  //     this.powerUpManager &&
  //     this.powerUpManager.spawnRandomPowerUp(rng, position)
  //   ) {
  //     const spawned = this.powerUpManager.getSpawnedPowerUps();
  //     const lastPowerUp = spawned[spawned.length - 1];
  //     this.triggerModifiers("onPowerUpSpawn", { powerUp: lastPowerUp });
  //   }
  // }

  // Getters & Setters
  getStatus(): GameStatus {
    return this.status;
  }

  setStatus(status: GameStatus): void {
    this.status = status;
  }

  getServerTickrateS(): number {
    return this.serverTickrateS;
  }

  getModifierManager(): ModifierManager {
    return this.modifierManager;
  }

  getRNG(): RNG {
    return this.rng;
  }
}
