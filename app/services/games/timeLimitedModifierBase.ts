import { GameBase } from "./gameBase";
import { ModifierBase, ModifierStatus } from "./modifierBase";

export abstract class TimeLimitedModifierBase extends ModifierBase {
  private ticks: number = 0;
  private duration: number = 0;

  constructor() {
    super();
  }

  activate(game: GameBase, playerId: number): void {
    super.activate(game, playerId);
    this.ticks = this.duration;
  }

  // Triggered events
  onUpdate(game: GameBase): void {
    if (this.duration <= 0 || this.status !== ModifierStatus.ACTIVE) return;

    this.ticks--;
    if (this.ticks <= 0) this.deactivate(game);
  }
}
