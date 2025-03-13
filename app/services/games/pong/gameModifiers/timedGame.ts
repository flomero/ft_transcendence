import { type GameBase, GameStatus } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";

export class TimedGame extends TimeLimitedModifierBase {
  name = "timedGame";

  constructor() {
    super();

    const durationS = GAME_REGISTRY.pong.gameModifiers[this.name].durationS;
    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    this.duration = durationS * serverTickrateS;
  }

  onDeactivation(game: GameBase): void {
    game.setStatus(GameStatus.FINISHED);
    game.getModifierManager().removeModifier(this);
  }
}
