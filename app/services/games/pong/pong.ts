import { GameObject } from "../../../types/games/gameObject";
import { GameBase } from "../gameBase";

export class Pong extends GameBase {
  protected gameObjects: GameObject[] = [];

  constructor(gameData: Record<string, any>) {
    super(gameData);
  }

  async update(): Promise<void> {}

  loadStateSnapshot(snapshot: Record<string, any>): void {}
}
