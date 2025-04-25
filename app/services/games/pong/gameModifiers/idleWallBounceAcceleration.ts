import { ModifierBase } from "../../modifierBase";
import { Pong } from "../pong";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";

export class IdleWallBounceAcceleration extends ModifierBase {
  name = "idleWallBounceAcceleration";

  protected bumperVelocityFactor: number = 0;

  constructor(customConfig?: Record<string, any>) {
    super();

    const defaultRegistry = GAME_REGISTRY.pong.gameModifiers[this.name];

    this.configManager.registerPropertyConfig(
      "bumperVelocityFactor",
      (_, context) => {
        const bumperVelocityPercent =
          context.bumperVelocityFactor || defaultRegistry.bumperVelocityPercent;
        return bumperVelocityPercent / 100.0;
      },
      undefined,
    );

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);
  }

  onWallBounce(game: Pong, args: { wallID: number }): void {
    if (args.wallID % 2 !== 0 || game.isEliminated(args.wallID / 2)) return;

    const gameState = game.getState();
    if (gameState.balls.length !== 0)
      gameState.balls[0].speed *= 1 + this.bumperVelocityFactor;
  }
}
