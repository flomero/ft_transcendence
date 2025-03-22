import { RNG } from "./rng";
import { ModifierManager } from "./modifierManager";
import { ConfigManager } from "./configManager";

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
  protected configManager: ConfigManager;

  constructor(public gameData: Record<string, any>) {
    this.lastUpdateTime = Date.now();
    this.startTimeMs = Date.now();

    this.rng = new RNG();
    this.modifierManager = new ModifierManager(this);
    this.configManager = new ConfigManager();
  }

  abstract update(): void;

  startGame(): void {
    this.modifierManager.initializeModifiers();
    this.modifierManager.initializePowerUps();
  }

  getStateSnapshot(): Record<string, any> {
    return {
      timestamp: this.lastUpdateTime,
    };
  }

  abstract loadStateSnapshot(snapshot: Record<string, any>): void;

  async handleAction(action: Record<string, any>): Promise<void> {}

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

  abstract getResults(): number[];
  abstract getSettings(): Record<string, any>;
}
