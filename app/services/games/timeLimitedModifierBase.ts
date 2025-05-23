import type { GameBase } from "./gameBase";
import { ModifierBase, ModifierStatus } from "./modifierBase";

export abstract class TimeLimitedModifierBase extends ModifierBase {
  protected ticks: number = 0;
  protected duration: number = 0;

  constructor() {
    super();
  }

  activate(game: GameBase): void {
    super.activate(game);
    this.ticks = this.duration;
  }

  // Triggered events
  onUpdate(game: GameBase): void {
    if (this.status !== ModifierStatus.ACTIVE) return;

    this.ticks--;
    if (this.ticks <= 0) this.deactivate(game);
  }

  // Getters & Setters
  setDuration(duration: number): void {
    this.duration = duration;
  }

  getState(): Record<string, any> {
    return {
      ...super.getState(),
      ticks: this.ticks,
      duration: this.duration,
    };
  }
}
