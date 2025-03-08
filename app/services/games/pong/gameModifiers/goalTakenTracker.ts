import { Pong } from "../pong";
import { PongModifierBase } from "../pongModifierBase";

export class GoalTakenTracker extends PongModifierBase {
  name = "goalTakenTracker";

  constructor() {
    super();
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    if (
      args.playerId < 0 ||
      args.playerId >= game.getExtraGameData().playerCount
    ) {
      console.log(`${args.playerId} out of bounds`);
      return;
    }

    game.editScore(args.playerId, 1);
  }
}
