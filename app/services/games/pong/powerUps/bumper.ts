import type { Rectangle } from "../../../../types/games/pong/rectangle";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";

export class Bumper extends TimeLimitedModifierBase {
  name = "bumper";

  protected bumpers: Rectangle[] = [];
  protected bumperJunctionDistanceFromCenter: number = 0;
  protected bumperWallJunctionDistance: number = 0;

  protected initialVelocity: number = 0;
  protected velocityFactor: number = 0;

  protected bumperVelocityFactor: number = 0;
  protected bumperMaxVelocityFactor: number = 0;
  protected bumperAcceleration: number = 0;

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
      "bumperJunctionDistanceFromCenter",
      (_, context) => {
        const bumperJunctionDistanceFromCenterPercent =
          context.bumperJunctionDistanceFromCenter ||
          defaultRegistry.bumperJunctionDistanceFromCenterPercent;
        return bumperJunctionDistanceFromCenterPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "bumperWallJunctionDistance",
      (_, context) => {
        const bumperWallJunctionDistancePercent =
          context.bumperWallJunctionDistance ||
          defaultRegistry.bumperWallJunctionDistancePercent;
        return bumperWallJunctionDistancePercent / 100.0;
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
      "bumperMaxVelocityFactor",
      (_, context) => {
        const bumperMaxVelocityPercent =
          context.bumperMaxVelocityFactor ||
          defaultRegistry.bumperMaxVelocityPercent;
        return bumperMaxVelocityPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "bumperAcceleration",
      (_, context) => {
        const bumperAccelerationPercentS =
          context.bumperAcceleration ||
          defaultRegistry.bumperAccelerationPercentS;
        return bumperAccelerationPercentS / (100.0 * serverTickrateS);
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
    if (gameState.balls.length === 0) {
      this.deactivate(game);
      return;
    }
    this.initialVelocity = gameState.balls[0].speed;

    // Convert percentages to actual distances based on arena dimensions
    const junctionDistanceFromCenter =
      (this.bumperJunctionDistanceFromCenter * game.getSettings().arenaHeight) /
      2.0;
    const wallJunctionDistance =
      this.bumperWallJunctionDistance * game.getState().walls[1].width;

    Array.from({ length: gameState.playerCount }).forEach((_, index) => {
      const wallID = 2 * index + 1;
      const wall = gameState.walls[wallID];
      const ca = parseFloat(Math.cos(wall.alpha).toFixed(3));
      const sa = parseFloat(Math.sin(wall.alpha).toFixed(3));

      // Calculate junction point for the bumpers
      const junctionX = wall.x - junctionDistanceFromCenter * ca;
      const junctionY = wall.y - junctionDistanceFromCenter * sa;

      // Calculate the bumper length based on the wall junction distance
      const bumperLength = Math.sqrt(
        junctionDistanceFromCenter ** 2 + wallJunctionDistance ** 2 / 4.0,
      );

      // Calculate the angle for the bumpers based on distances
      // Note: Changed the order of arguments in atan2 to get the correct angle
      const bumperAngle = Math.atan2(
        wallJunctionDistance / 2.0,
        junctionDistanceFromCenter,
      );

      // 'LEFT' BUMPER - Fixed the angle calculation
      const leftAngle = wall.alpha - bumperAngle;
      const leftCa = parseFloat(Math.cos(leftAngle).toFixed(3));
      const leftSa = parseFloat(Math.sin(leftAngle).toFixed(3));

      // Normal vector for left bumper (pointing outward from arena)
      const leftNx = -leftSa;
      const leftNy = leftCa;

      // Direction vector (perpendicular to normal, defines the "length" direction)
      const leftDx = leftCa;
      const leftDy = leftSa;

      // Calculate center of left bumper (halfway along its length from junction)
      const leftCenterX = junctionX + (bumperLength / 2) * leftDx;
      const leftCenterY = junctionY + (bumperLength / 2) * leftDy;

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
        width: bumperLength,
        height: wall.height, // Same height as the original wall
        alpha: leftAngle,
        isVisible: true,
      };

      // 'RIGHT' BUMPER - Fixed the angle calculation
      const rightAngle = wall.alpha + bumperAngle;
      const rightCa = parseFloat(Math.cos(rightAngle).toFixed(3));
      const rightSa = parseFloat(Math.sin(rightAngle).toFixed(3));

      // Normal vector for right bumper
      const rightNx = -rightSa;
      const rightNy = rightCa;

      // Direction vector
      const rightDx = rightCa;
      const rightDy = rightSa;

      // Calculate center of right bumper (halfway along its length from junction)
      const rightCenterX = junctionX + (bumperLength / 2) * rightDx;
      const rightCenterY = junctionY + (bumperLength / 2) * rightDy;

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
        width: bumperLength,
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

    // Add velocity (clamped to max)
    this.velocityFactor += Math.min(
      this.bumperVelocityFactor,
      this.bumperMaxVelocityFactor,
    );
  }

  onUpdate(game: Pong): void {
    super.onUpdate(game);

    if (game.getState().balls.length === 0) return;
    game.getState().balls[0].speed =
      this.initialVelocity * (1.0 + this.velocityFactor);

    this.velocityFactor = Math.max(
      0.0,
      this.velocityFactor + this.bumperAcceleration,
    );
  }

  onDeactivation(game: Pong): void {
    if (game.getState().walls.length > 0)
      this.bumpers.forEach((bumperWall) => {
        const wallID = game.getState().walls.indexOf(bumperWall);
        if (wallID < 0) return;
        game.getState().walls.splice(wallID, 1);
      });
    game.getState().balls[0].speed = this.initialVelocity;
    game.getModifierManager().deletePowerUp(this);
  }
}
