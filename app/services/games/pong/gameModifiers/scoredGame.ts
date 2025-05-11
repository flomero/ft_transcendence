import { GameStatus } from "../../../../types/games/gameBaseState";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import type { Pong } from "../pong";
import { ModifierBase } from "../../modifierBase";
import { fastifyInstance } from "../../../../app";

export class ScoredGame extends ModifierBase {
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
    if (args.playerId < 0 || args.playerId >= game.getState().playerCount) {
      fastifyInstance.log.debug(`${args.playerId} out of bounds`);
      return;
    }

    const gameState = game.getState();
    if (gameState.scores[args.playerId] >= this.goalObjective) {
      game.setStatus(GameStatus.FINISHED);
      game.getModifierManager().removeModifier(this);
    }
  }

  onRandomizeGame(game: Pong): void {
    game.setStatus(GameStatus.FINISHED);

    const gameState = game.getState();
    if (gameState.playerCount === 2) {
      const rndWinner = game.getRNG().randomInt(0, 1);
      const rndLoserScore = game.getRNG().randomInt(0, this.goalObjective - 1);

      gameState.scores[rndWinner] = this.goalObjective;
      gameState.scores[(rndWinner + 1) % 2] = rndLoserScore;
    } else {
      const remainingPlayers = Array.from<number>({
        length: gameState.playerCount,
      })
        .map((_, index) => index)
        .filter((index) => !game.isEliminated(index));

      while (remainingPlayers.length > 0) {
        const rndPlayer = remainingPlayers.splice(
          game.getRNG().randomInt(0, remainingPlayers.length - 1),
          1,
        );
        if (rndPlayer.length === 0) return;
        game.eliminate(rndPlayer[0]);
      }
    }
  }
}
