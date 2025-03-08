import { ModifierBase } from "../modifierBase";
import { GameBase } from "../gameBase";

export class PongModifierBase extends ModifierBase {
  onGoal(game: GameBase, args: { playerId: number }): void {}
  onPaddleBounce(game: GameBase, args: { playerId: number }): void {}
  onWallBounce(game: GameBase): void {}
}
