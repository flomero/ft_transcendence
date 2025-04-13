import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { ModifierActivationMode } from "../../modifierBase";
import { Pong } from "../pong";
import { StrategyManager } from "../../../strategy/strategyManager";
import { IPongBallResetSampler } from "../../../../types/strategy/IPongBallResetSampler";

enum ShooterStatus {
  CREATED,
  CHARGING,
  SHOT,
}

export class Shooter extends TimeLimitedModifierBase {
  name = "shooter";

  protected shooterStatus: ShooterStatus = ShooterStatus.CREATED;
  protected chargeDuration: number = 0;
  protected chargeRadius: number = 0;
  protected shootInitialVelocityFactor: number = 0;
  protected shootAcceleration: number = 0;

  protected shootDirectionSampler: StrategyManager<
    IPongBallResetSampler,
    "sampleDirection"
  >;
  protected shootDirectionSamplerStrategyName: string = "";

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
      "shootInitialVelocityFactor",
      (_, context) => {
        const shootInitialVelocityPercent =
          context.shootInitialVelocityFactor ||
          defaultRegistry.shootInitialVelocityPercent;
        return shootInitialVelocityPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "shootAcceleration",
      (_, context) => {
        const shootFinalVelocityPercent =
          context.shootAcceleration ||
          defaultRegistry.shootFinalVelocityPercent;
        const shootAccelerationDuration = this.duration - this.chargeDuration;

        return (
          (shootFinalVelocityPercent / 100.0 -
            this.shootInitialVelocityFactor) /
          shootAccelerationDuration
        );
      },
      undefined,
      ["duration", "chargeDuration", "shootInitialVelocityFactor"],
    );

    this.configManager.registerPropertyConfig(
      "shootDirectionSamplerStrategyName",
      (value) => value,
      undefined,
    );

    const mergedConfig = { ...defaultRegistry };
    if (customConfig)
      Object.entries(customConfig).forEach((entry) => {
        mergedConfig[entry[0]] = entry[1];
      });

    this.configManager.loadComplexConfigIntoContainer(mergedConfig, this);

    this.shootDirectionSampler = new StrategyManager(
      this.shootDirectionSamplerStrategyName,
      "pongBallResetSampler",
      "sampleDirection",
    );
  }

  onActivation(game: Pong): void {
    if (game.getState().balls.length === 0) {
      this.deactivate(game);
      return;
    }

    const mainBall = game.getState().balls[0];

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
        mainBall.speed =
          shootingDirection.magnitude * this.shootInitialVelocityFactor;

        // Transition to shooting phase
        this.shooterStatus = ShooterStatus.SHOT;
      } else {
        // Still in charging phase, make the ball orbit
        this.updateChargingBall(game);
      }
    } else if (this.shooterStatus === ShooterStatus.SHOT) {
      // In shooting phase, accelerate the ball
      this.updateShootingBall(game);
    }
  }

  protected computeShootingDirection(game: Pong): {
    dx: number;
    dy: number;
    magnitude: number;
  } {
    // Get the main ball
    if (game.getState().balls.length === 0) {
      return { dx: 0, dy: 0, magnitude: 0 };
    }
    const mainBall = game.getState().balls[0];

    // Get the arena center
    const arenaCenter = {
      x: game.getSettings().arenaWidth / 2.0,
      y: game.getSettings().arenaHeight / 2.0,
    };

    // Sample direction as if ball was at center
    const directionFromCenter =
      this.shootDirectionSampler.executeStrategy(game);

    // Calculate the vector from arena center to sampled target point
    const targetVectorFromCenter = {
      x: Math.cos(directionFromCenter.angularDirection),
      y: Math.sin(directionFromCenter.angularDirection),
    };

    // Calculate the hypothetical target point (if ball was at center)
    const targetPointFromCenter = {
      x:
        arenaCenter.x +
        targetVectorFromCenter.x * game.getSettings().arenaWidth,
      y:
        arenaCenter.y +
        targetVectorFromCenter.y * game.getSettings().arenaHeight,
    };

    // Calculate the direction from ball's actual position to the target point
    const dx = targetPointFromCenter.x - mainBall.x;
    const dy = targetPointFromCenter.y - mainBall.y;

    // Normalize to get a unit vector
    const distance = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = distance > 0 ? dx / distance : 0;
    const normalizedDy = distance > 0 ? dy / distance : 0;

    return {
      dx: normalizedDx,
      dy: normalizedDy,
      magnitude: directionFromCenter.magnitude,
    };
  }

  protected updateChargingBall(game: Pong): void {
    const mainBall = game.getState().balls[0];
    // Calculate current relative position of ball to charge center
    const relativePos = {
      x: mainBall.x - this.chargeCenter.x,
      y: mainBall.y - this.chargeCenter.y,
    };

    // Distance from ball to charge center
    const distance = Math.sqrt(relativePos.x ** 2 + relativePos.y ** 2);

    // Normalize to get direction
    const direction = {
      x: relativePos.x / distance,
      y: relativePos.y / distance,
    };

    // Calculate the tangent direction (rotate by 90 degrees)
    const tangent = {
      x: -direction.y,
      y: direction.x,
    };

    // Move ball along the tangent to create an orbit
    // Adjust velocity based on the circumference and chargeDuration
    const orbitSpeed = (2 * Math.PI * distance) / this.chargeDuration;

    mainBall.dx = tangent.x * orbitSpeed;
    mainBall.dy = tangent.y * orbitSpeed;
  }

  protected updateShootingBall(game: Pong): void {
    const mainBall = game.getState().balls[0];
    mainBall.speed += this.shootAcceleration;
  }

  onDeactivation(game: Pong): void {
    game.getModifierManager().deletePowerUp(this);
  }
}
