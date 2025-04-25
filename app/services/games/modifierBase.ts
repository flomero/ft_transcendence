import { UserInput } from "../../types/games/userInput";
import { ConfigManager } from "./configManager";
import type { GameBase } from "./gameBase";
import { Pong } from "./pong/pong";

export enum ModifierStatus {
  INACTIVE,
  PAUSED,
  ACTIVE,
}

export enum ModifierActivationMode {
  AUTO,
  SELF,
}

export class ModifierBase {
  name: string = "";

  protected spawnWeight: number = 0;
  protected status: ModifierStatus = ModifierStatus.INACTIVE;
  protected activationMode: ModifierActivationMode =
    ModifierActivationMode.AUTO;

  protected playerId: number = -1;

  protected configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
  }

  activate(game: GameBase): void {
    this.status = ModifierStatus.ACTIVE;
    this.onActivation(game);
  }

  playerActivate(game: GameBase, args: { playerId: number }): void {
    this.playerId = args.playerId;
    this.activate(game);
  }

  deactivate(game: GameBase): void {
    this.status = ModifierStatus.INACTIVE;
    this.onDeactivation(game);
  }

  pause(game: GameBase): void {
    if (this.status !== ModifierStatus.ACTIVE) return;
    this.status = ModifierStatus.PAUSED;
    this.onPausing(game);
  }

  resume(game: GameBase): void {
    if (this.status !== ModifierStatus.PAUSED) return;
    this.onResuming(game);
  }

  // Triggered events
  onUpdate(game: GameBase): void {}
  onPaddleUpdate(game: GameBase, args: { playerId: number }): void {}

  onActivation(game: GameBase): void {}
  onDeactivation(game: GameBase): void {}
  onPausing(game: GameBase): void {}
  onResuming(game: GameBase): void {}

  onGameStart(game: GameBase): void {}

  onUserInput(game: GameBase, args: { input: UserInput }): void {}

  onPowerUpSpawn(game: GameBase): void {}
  onFailedPowerUpSpawn(game: GameBase, args: { reason: string }): void {}
  onPowerUpPickup(game: GameBase): void {}

  onCDFComputation(game: GameBase): void {}

  onGoal(game: Pong, args: { playerId: number }): void {}
  onPaddleBounce(game: Pong, args: { playerId: number }): void {}
  onWallBounce(game: Pong, args: { wallID: number }): void {}
  onPlayerElimination(game: Pong, args: { playerId: number }): void {}
  onArenaModification(game: Pong): void {}
  onBallReset(game: Pong): void {}
  onBallOutOfBounds(game: Pong, args: { ballID: number }): void {}

  // Getters & Setters
  getName(): string {
    return this.name;
  }

  getStatus(): ModifierStatus {
    return this.status;
  }

  setStatus(status: ModifierStatus): void {
    this.status = status;
  }

  getActivationMode(): ModifierActivationMode {
    return this.activationMode;
  }

  getState(): Record<string, any> {
    return {
      status: this.status.toString(),
    };
  }
}
