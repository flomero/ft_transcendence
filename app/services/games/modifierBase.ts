import { GameBase } from "./gameBase";

export abstract class ModifierBase {
  protected spawnWeight: number = 0;
  protected active: boolean = false;

  protected name: string = "";
  protected playerId: number = -1;

  constructor() {}

  activate(game: GameBase, playerId: number): void {
    this.playerId = playerId;
    this.active = true;
    this.onActivation(game);
  }

  deactivate(game: GameBase): void {
    this.active = false;
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
}
