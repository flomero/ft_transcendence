import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";

export class Elimination extends PongModifierBase {
  name = "elimination";

  threshold: number;

  constructor() {
    super();

    this.threshold = GAME_REGISTRY.pong.gameModifiers[this.name].threshold;
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    console.log(
      `Player ${args.playerId} took a goal: ${game.getExtraGameData().scores[args.playerId]}`,
    );
    if (
      args.playerId < 0 ||
      args.playerId >= game.getExtraGameData().playerCount
    ) {
      console.warn(`${args.playerId} out of bounds`);
      return;
    }

    if (game.getExtraGameData().scores[args.playerId] >= this.threshold) {
      game.getGameObjects().paddles[args.playerId].isVisible = false;

      console.log(`Player ${args.playerId} has been eliminated`);
      game.getModifierManager().trigger("onPlayerElimination", args);
    }
  }
}
