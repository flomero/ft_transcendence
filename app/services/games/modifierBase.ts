import type { GameBase } from "./gameBase";

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

  constructor() {}

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

  onActivation(game: GameBase): void {}
  onDeactivation(game: GameBase): void {}
  onPausing(game: GameBase): void {}
  onResuming(game: GameBase): void {}

  onGameStart(game: GameBase): void {}

  onUserInput(game: GameBase): void {}

  onPowerUpSpawn(game: GameBase): void {}
  onFailedPowerUpSpawn(game: GameBase, args: { reason: string }): void {}
  onPowerUpPickup(game: GameBase): void {}

  onCDFComputation(game: GameBase): void {}

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
}
