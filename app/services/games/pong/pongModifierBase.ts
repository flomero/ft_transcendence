import { ModifierBase } from "../modifierBase";
import { Pong } from "./pong";

export class PongModifierBase extends ModifierBase {
  onGoal(game: Pong, args: { playerId: number }): void {}
  onPaddleBounce(game: Pong, args: { playerId: number }): void {}
  onWallBounce(game: Pong): void {}
  onPlayerElimination(game: Pong, args: { playerId: number }): void {}
  onBallReset(game: Pong): void {}
}
