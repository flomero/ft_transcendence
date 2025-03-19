import { type GameBase, GameStatus } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";

export class TimedGame extends TimeLimitedModifierBase {
  name = "timedGame";

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    this.registerPropertyConfig(
      "duration",
      (durationS) => durationS * serverTickrateS,
      (duration) => duration / serverTickrateS,
    );

    const defaultConfig = {
      duration: GAME_REGISTRY.pong.gameModifiers[this.name].durationS,
    };
    this.loadSimpleConfig(defaultConfig);

    if (customConfig) this.loadSimpleConfig(customConfig);
  }

  onDeactivation(game: GameBase): void {
    game.setStatus(GameStatus.FINISHED);
    game.getModifierManager().removeModifier(this);
  }
}
