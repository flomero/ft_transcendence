import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";

export class MultiBall extends TimeLimitedModifierBase {
  name = "multiBall";

  protected ballCount: number = 0;
  protected totalAngle: number = 0;
  protected radiusFactor: number = 100;

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.powerUps[this.name];

    this.configManager.registerPropertyConfig(
      "spawnWeight",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "duration",
      (_, context) => {
        const durationS = context.duration || defaultRegistry.durationS;
        return durationS * serverTickrateS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "activationMode",
      (_, context) => {
        const selfActivation =
          context.activationMode || defaultRegistry.selfActivation
            ? ModifierActivationMode.SELF
            : ModifierActivationMode.AUTO;
        return selfActivation;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "ballCount",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "totalAngle",
      (_, context) => {
        const totalAngleDeg =
          context.totalAngle || defaultRegistry.totalAngleDeg;
        return (totalAngleDeg * Math.PI) / 180.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "radiusFactor",
      (_, context) => {
        const radiusFactorPercent =
          context.radiusFactor || defaultRegistry.radiusFactorPercent;
        return radiusFactorPercent / 100.0;
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

  onActivation(game: Pong): void {
    if (!game.getState().balls) return;

    const mainBall = game.getState().balls[0];
    const ogAngle = Math.atan2(mainBall.dy, mainBall.dx);
    const angleStep = this.totalAngle / (this.ballCount + 1);
    const angles = Array.from({ length: this.ballCount + 1 }).map(
      (_, index) => ogAngle + index * angleStep - this.totalAngle / 2.0,
    );

    console.log(`Angle step: (deg)\n  |- ${(angleStep * 180.0) / Math.PI}`);
    console.log(`Total angle: ${(this.totalAngle * 180.0) / Math.PI}`);

    console.log(`Computed angles:`);
    console.dir(angles, { depth: null });

    // Select which ball will be the real one
    const rndBallID = game.getRNG().randomInt(0, angles.length - 1);

    angles.forEach((angle, index) => {
      if (index === rndBallID) return;

      const ca = Math.cos(angle);
      const sa = Math.sin(angle);

      game.getState().balls.push({
        id: 10 + index,
        x: mainBall.x,
        y: mainBall.y,
        dx: ca,
        dy: sa,
        radius: mainBall.radius * this.radiusFactor,
        speed: mainBall.speed,
        doCollision: true,
        isVisible: true,
        doGoal: false,
      });
    });

    game.getState().balls[0].dx = Math.cos(angles[rndBallID]);
    game.getState().balls[0].dy = Math.sin(angles[rndBallID]);
  }

  onDeactivation(game: Pong): void {
    game.getModifierManager().deletePowerUp(this);
    game.resetBall(game.getState(), -1, true);
  }

  onGoal(game: Pong, args: { playerId: number }): void {
    this.deactivate(game);
  }

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    this.deactivate(game);
  }
}
