import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierBase, ModifierStatus } from "../../modifierBase";
import type { Pong } from "../pong";

export class GoalReset extends ModifierBase {
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
    game.getState().balls[0].speed = 0;
    if (this.ticks < 0) {
      game.getState().balls[0].speed = this.ballSpeed;
      this.status = ModifierStatus.ACTIVE;
    }
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    game.getModifierManager().trigger("onBallReset", { ballID: -1 });

    this.ticks = this.delay;
    this.status = ModifierStatus.PAUSED;

    const gameState = game.getState();

    game.resetBall(gameState, -1, true);
    this.ballSpeed = gameState.balls[0].speed;
    gameState.balls[0].speed = 0;
  }

  onBallOutOfBounds(game: Pong, args: { ballID: number }): void {
    // console.dir(game.getState().balls[args.ballID], { depth: null });

    game.getModifierManager().trigger("onBallReset", { ballID: args.ballID });
    this.ticks = this.delay;
    this.status = ModifierStatus.PAUSED;

    const gameState = game.getState();

    game.resetBall(gameState, -1, true);
    this.ballSpeed = gameState.balls[0].speed;
    gameState.balls[0].speed = 0;
  }
}
