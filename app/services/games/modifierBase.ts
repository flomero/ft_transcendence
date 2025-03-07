import { GameBase } from "./gameBase";

export enum ModifierStatus {
  INACTIVE,
  ACTIVE,
}

export abstract class ModifierBase {
  protected spawnWeight: number = 0;
  protected status: ModifierStatus = ModifierStatus.INACTIVE;

  protected name: string = "";
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
  abstract onUpdate(game: GameBase): void;

  abstract onActivation(game: GameBase): void;
  abstract onDeactivation(game: GameBase): void;

  abstract onGameStart(game: GameBase): void;

  abstract onUserInput(game: GameBase): void;

  abstract onPowerUpSpawn(game: GameBase): void;
  abstract onPowerUpPickup(game: GameBase): void;

  // Getters & Setters
  getName(): string {
    return this.name;
  }

  getStatus(): ModifierStatus {
    return this.status;
  }
}
