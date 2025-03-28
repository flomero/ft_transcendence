import { GameStatus } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import type { Pong } from "../pong";
import { PongModifierBase } from "../pongModifierBase";

export class ScoredGame extends PongModifierBase {
  name = "scoredGame";

  protected goalObjective: number;

  constructor(customConfig?: Record<string, any>) {
    super();

    this.goalObjective =
      GAME_REGISTRY.pong.gameModifiers[this.name].goalObjective;

    if (customConfig)
      this.configManager.loadSimpleConfigIntoContainer(customConfig, this);
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    if (
      args.playerId < 0 ||
      args.playerId >= game.getExtraGameData().playerCount
    ) {
      console.log(`${args.playerId} out of bounds`);
      return;
    }

    if (game.getExtraGameData().scores[args.playerId] >= this.goalObjective) {
      game.setStatus(GameStatus.FINISHED);
      game.getModifierManager().removeModifier(this);
    }
  }
}
