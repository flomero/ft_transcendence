import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { GameStatus } from "../../gameBase";

export class SurvivalGame extends PongModifierBase {
  name = "survivalGame";

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    if (args.playerId < 0 || args.playerId >= game.getState().playerCount) {
      console.warn(`${args.playerId} out of bounds`);
      return;
    }

    const remainingPlayers = (game.getState().results as number[]).filter(
      (value) => {
        return value === 0;
      },
    );

    if (remainingPlayers.length > 1) return;

    game.setStatus(GameStatus.FINISHED);
  }
}
