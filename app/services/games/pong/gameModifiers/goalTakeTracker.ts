import { Pong } from "../pong";
import { PongModifierBase } from "../pongModifierBase";

export class GoalTakeTracker extends PongModifierBase {
  name = "goalTakeTracker";

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
