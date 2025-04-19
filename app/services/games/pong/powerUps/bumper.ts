import type { Rectangle } from "../../../../types/games/pong/rectangle";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";

export class Bumper extends TimeLimitedModifierBase {
  name = "bumper";

  protected bumpers: Rectangle[] = [];
  protected bumperVelocityFactor: number = 0;
  protected bumperAngle: number = 0;
  protected bumperJunctionDisanceFromCenter: number = 0;

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
      "bumperVelocityFactor",
      (_, context) => {
        const bumperVelocityPercent =
          context.bumperVelocityFactor || defaultRegistry.bumperVelocityPercent;
        return bumperVelocityPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "bumperAngle",
      (_, context) => {
        const bumperAngleDeg =
          context.bumperAngle || defaultRegistry.bumperAngleDeg;
        return (bumperAngleDeg * Math.PI) / 180.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "bumperJunctionDisanceFromCenter",
      (_, context) => {
        const bumperJunctionDisanceFromCenterPercent =
          context.bumperJunctionDisanceFromCenter ||
          defaultRegistry.bumperJunctionDisanceFromCenterPercent;
        return bumperJunctionDisanceFromCenterPercent / 100.0;
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
    const gameState = game.getState();

    // Width and height for the bumper
    const bumperJunctionDisanceFromCenter =
      (this.bumperJunctionDisanceFromCenter * game.getSettings().arenaHeight) /
      2.0;
    const bumpLength =
      bumperJunctionDisanceFromCenter / Math.cos(this.bumperAngle);

    Array.from({ length: gameState.playerCount }).forEach((_, index) => {
      const wallID = 2 * index + 1;
      const wall = gameState.walls[wallID];
      const ca = parseFloat(Math.cos(wall.alpha).toFixed(3));
      const sa = parseFloat(Math.sin(wall.alpha).toFixed(3));

      // Calculate junction point for the bumpers
      const junctionX = wall.x - bumperJunctionDisanceFromCenter * sa;
      const junctionY = wall.y + bumperJunctionDisanceFromCenter * ca;

      // 'LEFT' BUMPER
      const leftAngle = Math.PI / 2.0 - (wall.alpha + this.bumperAngle);
      const leftCa = parseFloat(Math.cos(leftAngle).toFixed(3));
      const leftSa = parseFloat(Math.sin(leftAngle).toFixed(3));

      // Normal vector for left bumper (pointing outward from arena)
      const leftNx = leftSa;
      const leftNy = leftCa;

      // Direction vector (perpendicular to normal, defines the "length" direction)
      const leftDx = leftCa;
      const leftDy = -leftSa;

      // Calculate center of left bumper (halfway along its length from junction)
      const leftCenterX = junctionX + (bumpLength / 2) * leftDx;
      const leftCenterY = junctionY + (bumpLength / 2) * leftDy;

      const leftBumper: Rectangle = {
        doCollision: true,
        id: 0,
        x: leftCenterX,
        y: leftCenterY,
        absX: leftCenterX,
        absY: leftCenterY,
        nx: leftNx, // Normal vector
        ny: leftNy,
        dx: leftDx, // Direction vector
        dy: leftDy,
        width: bumpLength,
        height: wall.height, // Same height as the original wall
        alpha: leftAngle,
        isVisible: true,
      };

      // 'RIGHT' BUMPER
      const rightAngle = Math.PI / 2.0 - (wall.alpha - this.bumperAngle);
      const rightCa = parseFloat(Math.cos(rightAngle).toFixed(3));
      const rightSa = parseFloat(Math.sin(rightAngle).toFixed(3));

      // Normal vector for right bumper
      const rightNx = rightSa;
      const rightNy = rightCa;

      // Direction vector
      const rightDx = rightCa;
      const rightDy = -rightSa;

      // Calculate center of right bumper (halfway along its length from junction)
      const rightCenterX = junctionX + (bumpLength / 2) * rightDx;
      const rightCenterY = junctionY + (bumpLength / 2) * rightDy;

      const rightBumper: Rectangle = {
        doCollision: true,
        id: 0,
        x: rightCenterX,
        y: rightCenterY,
        absX: rightCenterX,
        absY: rightCenterY,
        nx: rightNx, // Normal vector
        ny: rightNy,
        dx: rightDx, // Direction vector
        dy: rightDy,
        width: bumpLength,
        height: wall.height, // Same height as the original wall
        alpha: rightAngle,
        isVisible: true,
      };

      // Add both bumpers to the bumpers array
      this.bumpers.push(leftBumper, rightBumper);
    });

    // Add the bumpers to the game's walls
    gameState.walls.push(...this.bumpers);
  }

  onWallBounce(game: Pong, args: { wallID: number }): void {
    const isBumper = this.bumpers.includes(game.getState().walls[args.wallID]);
    if (!isBumper) return;

    game.getState().balls[0].speed *= 1.0 + this.bumperVelocityFactor;
  }

  onDeactivation(game: Pong): void {
    if (game.getState().walls.length > 0)
      this.bumpers.forEach((bumperWall) => {
        const wallID = game.getState().walls.indexOf(bumperWall);
        if (wallID < 0) return;
        game.getState().walls.splice(wallID, 1);
      });
    game.getModifierManager().deletePowerUp(this);
  }
}
