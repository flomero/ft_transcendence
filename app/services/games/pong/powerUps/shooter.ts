import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import type { Pong } from "../pong";
import { StrategyManager } from "../../../strategy/strategyManager";
import type { IPongPlayerSampler } from "../../../../types/strategy/IPongPlayerSampler";

enum ShooterStatus {
  CREATED,
  CHARGING,
  SHOT,
}

enum OrbitDirection {
  CW = -1,
  CCW = 1,
}

export class Shooter extends TimeLimitedModifierBase {
  name = "shooter";

  protected ballInitialSpeed: number = 0;

  protected shooterStatus: ShooterStatus = ShooterStatus.CREATED;
  protected chargeDuration: number = 0;
  protected chargeRadius: number = 0;
  protected orbitDirection: OrbitDirection = OrbitDirection.CCW;
  protected shootAdditionalVelocity: number = 0;
  protected shootAngularOffsetFactor: number = 0;
  protected shootStandardAngularDeviationFactor: number = 0;
  protected shootTargetWidthFactor: number = 0;

  protected playerSampler: StrategyManager<IPongPlayerSampler, "samplePlayer">;
  protected playerSamplerStrategyName: string = "";

  protected chargeCenter: { x: number; y: number } = { x: 0, y: 0 };

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
      "chargeDuration",
      (_, context) => {
        const chargeDurationS =
          context.chargeDuration || defaultRegistry.chargeDurationS;
        return chargeDurationS * serverTickrateS;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "chargeRadius",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "shootAdditionalVelocity",
      (_, context) => {
        const shootAdditionalVelocityPercent =
          context.shootAdditionalVelocity ||
          defaultRegistry.shootAdditionalVelocityPercent;
        return shootAdditionalVelocityPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "shootAngularOffsetFactor",
      (_, context) => {
        const shootAngularOffsetPercent =
          context.shootAngularOffsetFactor ||
          defaultRegistry.shootAngularOffsetPercent;
        return shootAngularOffsetPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "shootStandardAngularDeviationFactor",
      (_, context) => {
        const shootStandardAngularDeviationPercent =
          context.shootStandardAngularDeviationFactor ||
          defaultRegistry.shootStandardAngularDeviationPercent;
        return shootStandardAngularDeviationPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "shootTargetWidthFactor",
      (_, context) => {
        const shootTargetWidthPercent =
          context.shootTargetWidthFactor ||
          defaultRegistry.shootTargetWidthPercent;
        return shootTargetWidthPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "playerSamplerStrategyName",
      (value) => value,
      undefined,
    );

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.playerSampler = new StrategyManager(
      this.playerSamplerStrategyName,
      "pongPlayerSampler",
      "samplePlayer",
    );
  }

  onActivation(game: Pong): void {
    if (game.getState().balls.length === 0) {
      this.deactivate(game);
      return;
    }

    this.orbitDirection = game.getRNG().randomSign();

    const mainBall = game.getState().balls[0];
    this.ballInitialSpeed = mainBall.speed;

    const arenaCenter = {
      x: game.getSettings().arenaWidth / 2.0,
      y: game.getSettings().arenaHeight / 2.0,
    };

    // Calculate direction vector from ball to arena center
    const centerDirection = {
      x: arenaCenter.x - mainBall.x,
      y: arenaCenter.y - mainBall.y,
    };

    const centerDirectionMagnitude = Math.sqrt(
      centerDirection.x ** 2 + centerDirection.y ** 2,
    );

    // Handle the case where ball is already at center or closer than chargeRadius
    if (centerDirectionMagnitude <= this.chargeRadius) {
      // If ball is too close to center, place the orbit point in a random direction
      const randomAngle = Math.random() * 2 * Math.PI;
      this.chargeCenter = {
        x: mainBall.x + this.chargeRadius * Math.cos(randomAngle),
        y: mainBall.y + this.chargeRadius * Math.sin(randomAngle),
      };
    } else {
      // Use the direction vector to compute the orbit center
      // Scale the direction vector to have length chargeRadius
      centerDirection.x *= this.chargeRadius / centerDirectionMagnitude;
      centerDirection.y *= this.chargeRadius / centerDirectionMagnitude;

      // Set the orbit center at chargeRadius distance from the ball
      // in the direction of the arena center
      this.chargeCenter = {
        x: mainBall.x + centerDirection.x,
        y: mainBall.y + centerDirection.y,
      };
    }

    this.shooterStatus = ShooterStatus.CHARGING;
  }

  onUpdate(game: Pong): void {
    if (this.ticks < 0) {
      this.deactivate(game);
      return;
    }
    super.onUpdate(game);

    if (game.getState().balls.length === 0) {
      this.deactivate(game);
      return;
    }

    if (this.shooterStatus === ShooterStatus.CHARGING) {
      // Check if charging phase is complete
      if (this.ticks <= this.duration - this.chargeDuration) {
        const shootingDirection = this.computeShootingDirection(game);

        const mainBall = game.getState().balls[0];
        mainBall.dx = shootingDirection.dx;
        mainBall.dy = shootingDirection.dy;
        mainBall.speed += this.shootAdditionalVelocity * mainBall.speed;

        // Transition to shooting phase
        this.shooterStatus = ShooterStatus.SHOT;
      } else {
        // Still in charging phase, make the ball orbit
        this.updateChargingBall(game);
      }
    }
  }

  protected computeShootingDirection(game: Pong): {
    dx: number;
    dy: number;
  } {
    // Get the main ball
    if (game.getState().balls.length === 0) {
      return { dx: 0, dy: 0 };
    }
    const mainBall = game.getState().balls[0];

    // Sample direction as if ball was at center
    const targetPlayer = this.playerSampler.executeStrategy(game);

    // Generate the direction to shoot to
    // Compute the total angle from the ball to the selected player's goal
    const playerWall = game.getState().walls[2 * targetPlayer];
    const ballToCorner = {
      x:
        playerWall.x +
        (playerWall.dx * (this.shootTargetWidthFactor * playerWall.width)) /
          2.0 -
        mainBall.x,
      y:
        playerWall.y +
        (playerWall.dy * (this.shootTargetWidthFactor * playerWall.width)) /
          2.0 -
        mainBall.y,
    };

    const ballToWall = {
      x: playerWall.x - mainBall.x,
      y: playerWall.y - mainBall.y,
    };

    const dotProduct =
      ballToCorner.x * ballToWall.x + ballToCorner.y * ballToWall.y;
    const ballToCornerMag = Math.sqrt(
      ballToCorner.x ** 2 + ballToCorner.y ** 2,
    );
    const ballToWallMag = Math.sqrt(ballToWall.x ** 2 + ballToWall.y ** 2);

    const halfAngle = Math.acos(dotProduct / (ballToCornerMag * ballToWallMag));

    // Generate the random angle
    const rndAngle = game
      .getRNG()
      .randomGaussian(
        halfAngle * this.shootAngularOffsetFactor,
        halfAngle * this.shootStandardAngularDeviationFactor,
      );
    const rndSign = game.getRNG().randomSign();

    const clampedRndAngle = Math.min(halfAngle, Math.max(rndAngle, 0));

    // Compute the final direction
    const ca = Math.cos(clampedRndAngle * rndSign);
    const sa = Math.sin(clampedRndAngle * rndSign);

    ballToWall.x /= ballToWallMag;
    ballToWall.y /= ballToWallMag;
    const finalDirection = {
      dx: ballToWall.x * ca - ballToWall.y * sa,
      dy: ballToWall.x * sa + ballToWall.y * ca,
    };

    return finalDirection;
  }

  protected updateChargingBall(game: Pong): void {
    const mainBall = game.getState().balls[0];
    const cx = this.chargeCenter.x;
    const cy = this.chargeCenter.y;
    const r = this.chargeRadius;

    // Compute current angle on orbit
    const dx = mainBall.x - cx;
    const dy = mainBall.y - cy;
    const angle = Math.atan2(dy, dx);

    // Compute angular increment (speed = arc length = r * Δθ)
    const speed = mainBall.speed;
    const deltaTheta = speed / r;

    const nextAngle = angle + this.orbitDirection * deltaTheta;

    // Compute next desired position on the circle
    const nextX = cx + r * Math.cos(nextAngle);
    const nextY = cy + r * Math.sin(nextAngle);

    // Compute direction to move toward that next position
    const dirX = nextX - mainBall.x;
    const dirY = nextY - mainBall.y;
    const mag = Math.sqrt(dirX * dirX + dirY * dirY);

    mainBall.dx = dirX / mag;
    mainBall.dy = dirY / mag;
  }

  onDeactivation(game: Pong): void {
    game.getModifierManager().deletePowerUp(this);
  }

  onBallReset(game: Pong, args: { ballID: number }): void {
    if (args.ballID <= 0)
      // -1: resetting all balls, 0: mainBall -> don't deactivate on non-main ball reset
      this.deactivate(game);
  }
}
