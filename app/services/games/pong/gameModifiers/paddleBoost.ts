import { UserInput } from "../../../../types/games/userInput";
import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { Paddle } from "../../../../types/games/pong/paddle";

enum AnimationStatus {
  IDLE,
  EXTENDING,
  RETRACTING,
  EXTENDED,
}

type MovementDirection = "UP" | "DOWN" | "STOP";

interface PaddleInfos {
  initialVelocity: number;
  displacement: number;
  animationStatus: AnimationStatus;
  bufferedAnimationStatus?: AnimationStatus;
  lastMovementDirection: MovementDirection; // Track last movement input
}

export class PaddleBoost extends PongModifierBase {
  name = "paddleBoost";

  protected maxDisplacement: number = 50;
  protected extendedSpeedMultiplier: number = 0;

  protected paddlesInfos: PaddleInfos[] = [];
  protected paddleExtensionLength: number = 0;
  protected paddleExtensionVelocity: number = 0;
  protected paddleRetractionVelocity: number = 0;
  protected extensionVelocityTransmissionFactor: number = 0;

  constructor(customConfig?: Record<string, any>) {
    super();

    const serverTickrateS = GAME_REGISTRY.pong.serverTickrateS;
    const defaultRegistry = GAME_REGISTRY.pong.gameModifiers[this.name];

    this.configManager.registerPropertyConfig(
      "paddleExtensionLength",
      (value) => value,
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "extendedSpeedMultiplier",
      (_, context) => {
        const paddleExtendedSpeedMultiplierPercent =
          context.extendedSpeedMultiplier ||
          defaultRegistry.paddleExtendedSpeedMultiplierPercent;
        return paddleExtendedSpeedMultiplierPercent / 100.0;
      },
      undefined,
    );

    this.configManager.registerPropertyConfig(
      "paddleExtensionVelocity",
      (_, context) => {
        // 100 % displacement -> paddleExtensionLength
        //   -> In paddleExtensionDurationS ticks
        // -----------
        // In 1 tick -> paddleExtensionVelocity displacement
        const paddleExtensionDurationS =
          context.paddleExtensionVelocity ||
          defaultRegistry.paddleExtensionDurationS;

        return serverTickrateS / (paddleExtensionDurationS * 100);
      },
      undefined,
      ["paddleExtensionLength"],
    );

    this.configManager.registerPropertyConfig(
      "paddleRetractionVelocity",
      (_, context) => {
        // 100 % displacement -> paddleExtensionLength
        //   -> In paddleRetractionDurationS ticks
        // -----------
        // In 1 tick -> paddleRetractionVelocity displacement
        const paddleRetractionDurationS =
          context.paddleRetractionVelocity ||
          defaultRegistry.paddleRetractionDurationS;

        return serverTickrateS / (paddleRetractionDurationS * 100);
      },
      undefined,
      ["paddleExtensionLength"],
    );

    this.configManager.registerPropertyConfig(
      "extensionVelocityTransmissionFactor",
      (value) => value,
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
    gameState.paddles.forEach((paddle) => {
      this.paddlesInfos.push({
        initialVelocity: paddle.speed,
        displacement: -this.maxDisplacement,
        animationStatus: AnimationStatus.IDLE,
        lastMovementDirection: "STOP", // Initialize with no movement
      });
    });
  }

  onUserInput(game: Pong, args: { input: UserInput }): void {
    const paddleInfos = this.paddlesInfos[args.input.playerId];

    switch (args.input.type) {
      case "UP":
        // Remember the direction, even during animation
        paddleInfos.lastMovementDirection = "UP";
        // Only apply velocity immediately if we're in a state that allows movement
        if (
          [AnimationStatus.IDLE, AnimationStatus.EXTENDED].includes(
            paddleInfos.animationStatus,
          )
        ) {
          this.applyMovementDirection(
            game.getState().paddles[args.input.playerId],
            paddleInfos,
          );
        }
        break;

      case "DOWN":
        // Remember the direction, even during animation
        paddleInfos.lastMovementDirection = "DOWN";
        // Only apply velocity immediately if we're in a state that allows movement
        if (
          [AnimationStatus.IDLE, AnimationStatus.EXTENDED].includes(
            paddleInfos.animationStatus,
          )
        ) {
          this.applyMovementDirection(
            game.getState().paddles[args.input.playerId],
            paddleInfos,
          );
        }
        break;

      case "STOP":
        // Reset movement only if the player isn't pressing the other direction
        paddleInfos.lastMovementDirection = "STOP";
        // Only apply velocity immediately if we're in a state that allows movement
        if (
          [AnimationStatus.IDLE, AnimationStatus.EXTENDED].includes(
            paddleInfos.animationStatus,
          )
        ) {
          this.applyMovementDirection(
            game.getState().paddles[args.input.playerId],
            paddleInfos,
          );
        }
        break;

      case "SPACE":
        this.bufferAnimation(paddleInfos, AnimationStatus.EXTENDING);
        break;

      case "STOP_SPACE":
        this.bufferAnimation(paddleInfos, AnimationStatus.RETRACTING);
        break;
    }
  }

  // Helper method to apply the correct velocity based on movement direction
  protected applyMovementDirection(
    paddle: Paddle,
    paddleInfos: PaddleInfos,
  ): void {
    // Calculate effective speed based on animation state
    const effectiveSpeed =
      paddleInfos.animationStatus === AnimationStatus.EXTENDED
        ? paddleInfos.initialVelocity * this.extendedSpeedMultiplier
        : paddleInfos.initialVelocity;

    // Apply the direction
    switch (paddleInfos.lastMovementDirection) {
      case "UP":
        paddle.velocity = effectiveSpeed;
        break;
      case "DOWN":
        paddle.velocity = -effectiveSpeed;
        break;
      case "STOP":
        paddle.velocity = 0;
        break;
    }
  }

  onPaddleUpdate(game: Pong, args: { playerId: number }): void {
    const paddleInfos: PaddleInfos = this.paddlesInfos[args.playerId];
    const paddle = game.getState().paddles[args.playerId];

    switch (paddleInfos.animationStatus) {
      case AnimationStatus.EXTENDING: {
        // Block normal movement during extension
        paddle.speed = paddleInfos.initialVelocity;
        paddle.velocity = 0; // Force stop regular movement
        this.movePaddle(paddle, paddleInfos, 1, this.paddleExtensionVelocity);

        if (paddleInfos.displacement === this.maxDisplacement) {
          this.transitionAnimation(paddleInfos, AnimationStatus.EXTENDED);
          // Apply stored movement direction when transitioning to extended
          paddle.speed =
            paddleInfos.initialVelocity * this.extendedSpeedMultiplier;
          this.applyMovementDirection(paddle, paddleInfos);
        }
        break;
      }

      case AnimationStatus.RETRACTING: {
        // Block normal movement during retraction
        paddle.speed = paddleInfos.initialVelocity;
        paddle.velocity = 0; // Force stop regular movement
        this.movePaddle(paddle, paddleInfos, -1, this.paddleRetractionVelocity);

        if (paddleInfos.displacement === -this.maxDisplacement) {
          this.transitionAnimation(paddleInfos, AnimationStatus.IDLE);
          // Restore normal speed when idle and apply stored movement
          paddle.speed = paddleInfos.initialVelocity;
          this.applyMovementDirection(paddle, paddleInfos);
        }
        break;
      }

      case AnimationStatus.EXTENDED: {
        // Allow movement with reduced speed, already handled in applyMovementDirection
        paddle.speed =
          paddleInfos.initialVelocity * this.extendedSpeedMultiplier;
        break;
      }

      case AnimationStatus.IDLE: {
        // Normal movement, already handled in applyMovementDirection
        paddle.speed = paddleInfos.initialVelocity;
        break;
      }
    }

    // Handle buffered animation transitions
    if (paddleInfos.bufferedAnimationStatus) {
      this.processBufferedAnimation(paddleInfos);
    }
  }

  onPaddleBounce(game: Pong, args: { ballId: number; playerId: number }): void {
    const ball = game.getState().balls[args.ballId];
    const paddle = game.getState().paddles[args.playerId];
    const paddleInfos = this.paddlesInfos[args.playerId];

    // Only apply additional effects if the paddle is extending
    if (paddleInfos.animationStatus === AnimationStatus.EXTENDING) {
      // Calculate extension velocity based on the paddle's normal vector and extension velocity
      const extensionVx =
        (paddle.nx *
          this.paddleExtensionVelocity *
          this.paddleExtensionLength) /
        100;
      const extensionVy =
        (paddle.ny *
          this.paddleExtensionVelocity *
          this.paddleExtensionLength) /
        100;

      // Calculate extension speed
      const extensionSpeed = Math.sqrt(
        extensionVx * extensionVx + extensionVy * extensionVy,
      );

      if (extensionSpeed > 0) {
        // Calculate how much of the extension direction aligns with the normal vector
        // For a extending paddle, this is mostly just the extension direction itself
        const boostStrength =
          (paddleInfos.displacement / this.maxDisplacement + 1) *
          this.extensionVelocityTransmissionFactor;

        // Add velocity component in the paddle's normal direction
        ball.dx += paddle.nx * boostStrength;
        ball.dy += paddle.ny * boostStrength;

        // Normalize the direction vector
        const norm = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        ball.dx /= norm;
        ball.dy /= norm;

        // Apply speed boost proportional to how far extended the paddle is
        // The closer to full extension, the more powerful the boost
        const extensionPercent =
          (paddleInfos.displacement + this.maxDisplacement) /
          (2 * this.maxDisplacement);
        const speedBoost =
          extensionSpeed *
          this.extensionVelocityTransmissionFactor *
          extensionPercent;

        // Add to ball speed
        ball.speed += speedBoost;

        // Cap the maximum speed if necessary
        const maxSpeed = game.getSettings().ballMaxSpeed || 20;
        if (ball.speed > maxSpeed) {
          ball.speed = maxSpeed;
        }

        console.log(
          `Extended paddle collision! Ball speed: ${ball.speed.toFixed(2)}, direction: [${ball.dx.toFixed(2)}, ${ball.dy.toFixed(2)}]`,
        );
      }
    }
  }

  protected movePaddle(
    paddle: Paddle,
    paddleInfos: PaddleInfos,
    direction: number,
    velocity: number,
  ) {
    let newDisplacement = paddleInfos.displacement + direction * velocity;
    newDisplacement = Math.max(
      -this.maxDisplacement,
      Math.min(newDisplacement, this.maxDisplacement),
    );

    const deltaDisplacement = newDisplacement - paddleInfos.displacement;

    // Update paddle position
    paddle.x +=
      (deltaDisplacement / 100.0) * this.paddleExtensionLength * paddle.nx;
    paddle.y +=
      (deltaDisplacement / 100.0) * this.paddleExtensionLength * paddle.ny;
    paddleInfos.displacement = newDisplacement;
  }

  protected processBufferedAnimation(paddleInfos: PaddleInfos): void {
    // Only process buffered animations when in a stable state
    if (
      [AnimationStatus.IDLE, AnimationStatus.EXTENDED].includes(
        paddleInfos.animationStatus,
      )
    ) {
      const nextAnimation = paddleInfos.bufferedAnimationStatus;
      paddleInfos.bufferedAnimationStatus = undefined;

      // Only change animation if transition is valid
      if (
        paddleInfos.animationStatus === AnimationStatus.IDLE &&
        nextAnimation === AnimationStatus.EXTENDING
      ) {
        paddleInfos.animationStatus = AnimationStatus.EXTENDING;
      } else if (
        paddleInfos.animationStatus === AnimationStatus.EXTENDED &&
        nextAnimation === AnimationStatus.RETRACTING
      ) {
        paddleInfos.animationStatus = AnimationStatus.RETRACTING;
      }
    }
  }

  protected transitionAnimation(
    paddleInfos: PaddleInfos,
    animationStatus: AnimationStatus,
  ) {
    paddleInfos.animationStatus = animationStatus;
  }

  protected bufferAnimation(
    paddleInfos: PaddleInfos,
    animationStatus: AnimationStatus,
  ) {
    paddleInfos.bufferedAnimationStatus = animationStatus;

    // Immediately process the animation if we're in a stable state
    if (
      [AnimationStatus.IDLE, AnimationStatus.EXTENDED].includes(
        paddleInfos.animationStatus,
      )
    ) {
      this.processBufferedAnimation(paddleInfos);
    }
  }
}
