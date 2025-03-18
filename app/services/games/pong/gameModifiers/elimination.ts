import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";

export class Elimination extends PongModifierBase {
  name = "elimination";

  private threshold: number;

  private eliminatedCounter: number = 0;

  constructor() {
    super();

    this.threshold = GAME_REGISTRY.pong.gameModifiers[this.name].threshold;
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    if (
      args.playerId < 0 ||
      args.playerId >= game.getExtraGameData().playerCount
    ) {
      console.warn(`${args.playerId} out of bounds`);
      return;
    }

    if (game.getExtraGameData().scores[args.playerId] >= this.threshold) {
      game.getGameObjects().paddles[args.playerId].isVisible = false;
      game.getExtraGameData().results[args.playerId] =
        game.getExtraGameData().playerCount - this.eliminatedCounter++;

      console.log(`Player ${args.playerId} has been eliminated`);
      console.log(
        `  |--> it's results: ${game.getExtraGameData().results[args.playerId]}`,
      );

      game.getModifierManager().trigger("onPlayerElimination", args);
    }
  }
}
