import { ModifierManager } from "./modifierManager";
import { ConfigManager } from "./configManager";

export enum GameStatus {
  CREATED,
  RUNNING,
  PAUSED,
  FINISHED,
}

export interface GameBaseState {
  startDate: number;
  lastUpdate: number;
  status: GameStatus;
}

export abstract class GameBase {
  protected gameBaseState: GameBaseState;
  protected serverTickrateS: number = 20;

  protected modifierManager: ModifierManager;
  protected configManager: ConfigManager;

  constructor(public gameData: Record<string, any>) {
    this.gameBaseState = {
      startDate: Date.now(),
      lastUpdate: Date.now(),
      status: GameStatus.CREATED,
    };

    this.modifierManager = new ModifierManager(this);
    this.configManager = new ConfigManager();
  }

  abstract update(): void;

  startGame(): void {
    this.modifierManager.initializeModifiers();
    this.modifierManager.initializePowerUps();
    this.gameBaseState.status = GameStatus.RUNNING;
  }

  getStateSnapshot(): Record<string, any> {
    const state = {
      startDate: this.gameBaseState.startDate,
      lastUpdate: this.gameBaseState.lastUpdate,
      status: this.gameBaseState.status,
      modifiersState: this.modifierManager.getStateSnapshot(),
    };

    return state;
  }

  abstract loadStateSnapshot(snapshot: Record<string, any>): void;

  async handleAction(action: Record<string, any>): Promise<void> {}

  // Getters & Setters
  getStatus(): GameStatus {
    return this.gameBaseState.status;
  }

  setStatus(status: GameStatus): void {
    this.gameBaseState.status = status;
  }

  getServerTickrateS(): number {
    return this.serverTickrateS;
  }

  getModifierManager(): ModifierManager {
    return this.modifierManager;
  }

  abstract eliminate(playerID: number): void;

  abstract getResults(): number[];
  abstract getScores(): number[];
  abstract getSettings(): Record<string, any>;
}
