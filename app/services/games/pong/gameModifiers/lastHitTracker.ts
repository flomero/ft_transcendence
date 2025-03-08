import { Pong } from "../pong";
import { PongModifierBase } from "../pongModifierBase";

export class LastHitTracker extends PongModifierBase {
  name = "lastHitTracker";

  constructor() {
    super();
  }

  onPaddleBounce(game: Pong, args: { playerId: number }): void {
    if (
      args.playerId < 0 ||
      args.playerId >= game.getExtraGameData().playerCount
    ) {
      console.log(`${args.playerId} out of bounds`);
      return;
    }

    game.setLastHit(args.playerId);
  }
}
