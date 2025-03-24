import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierStatus } from "../../modifierBase";
import { Pong } from "../pong";
import { PongModifierBase } from "../pongModifierBase";

export class GoalReset extends PongModifierBase {
  name = "goalReset";

  private ticks: number = 0;
  private ballSpeed: number = 0;

  protected delay: number = 0;

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;

    this.configManager.registerPropertyConfig(
      "delay",
      (delayS) => delayS * serverTickrateS,
    );

    const defaultConfig = {
      delay: GAME_REGISTRY.pong.gameModifiers[this.name].delayS,
    };

    this.configManager.loadSimpleConfigIntoContainer(defaultConfig, this);

    if (customConfig)
      this.configManager.loadSimpleConfigIntoContainer(customConfig, this);
  }

  onUpdate(game: Pong): void {
    if (this.status !== ModifierStatus.PAUSED) return;

    --this.ticks;
    if (this.ticks < 0) {
      game.getGameObjects().balls[0].speed = this.ballSpeed;
      this.status = ModifierStatus.ACTIVE;
    }
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    if (this.status !== ModifierStatus.ACTIVE) return;
    this.ticks = this.delay;
    this.status = ModifierStatus.PAUSED;

    game.resetBall(-1);
    this.ballSpeed = game.getGameObjects().balls[0].speed;
    game.getGameObjects().balls[0].speed = 0;
  }
}
