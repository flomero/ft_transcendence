import { Pong } from "../pong";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierBase } from "../../modifierBase";

export class Elimination extends ModifierBase {
  name = "elimination";

  protected threshold: number;

  protected eliminatedCounter: number = 0;

  constructor(customConfig?: Record<string, any>) {
    super();

    this.threshold = GAME_REGISTRY.pong.gameModifiers[this.name].threshold;

    if (customConfig)
      this.configManager.loadSimpleConfigIntoContainer(customConfig, this);
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    if (args.playerId < 0 || args.playerId >= game.getState().playerCount) {
      console.warn(`${args.playerId} out of bounds`);
      return;
    }

    const gameState = game.getState();
    if (gameState.scores[args.playerId] >= this.threshold)
      game.getModifierManager().trigger("onPlayerElimination", args);
  }

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    if (game.isEliminated(args.playerId)) return;
    const gameState = game.getState();

    gameState.paddles[args.playerId].isVisible = false;
    gameState.results[args.playerId] =
      gameState.playerCount - gameState.eliminatedPlayers.length;
    gameState.eliminatedPlayers.push(args.playerId);

    game
      .getModifierManager()
      .trigger("onResultUpdate", { playerId: args.playerId });
  }
}
