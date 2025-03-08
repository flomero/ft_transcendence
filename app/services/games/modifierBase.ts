import { GameBase } from "./gameBase";

export enum ModifierStatus {
  INACTIVE,
  ACTIVE,
}

export class ModifierBase {
  name: string = "";

  protected spawnWeight: number = 0;
  protected status: ModifierStatus = ModifierStatus.INACTIVE;

  protected playerId: number = -1;

  constructor() {}

  activate(game: GameBase, playerId: number): void {
    this.playerId = playerId;
    this.status = ModifierStatus.ACTIVE;
    this.onActivation(game);
  }

  deactivate(game: GameBase): void {
    this.status = ModifierStatus.INACTIVE;
    this.onDeactivation(game);
  }

  // Triggered events
  onUpdate(game: GameBase): void {}

  onActivation(game: GameBase): void {}
  onDeactivation(game: GameBase): void {}

  onGameStart(game: GameBase): void {}

  onUserInput(game: GameBase): void {}

  onPowerUpSpawn(game: GameBase): void {}
  onPowerUpPickup(game: GameBase): void {}

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
}
