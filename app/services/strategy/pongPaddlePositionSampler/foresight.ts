import { ExtendedCollisionData } from "../../../types/games/pong/extendedCollisionData";
import {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import { PongGameState } from "../../games/pong/pong";
import { PongAIOpponent } from "../../games/pong/pongAIOpponent";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class Foresight implements IPongPaddlePositionSampler {
  name = "foresight";

  protected widthFactor: number;
  protected lookAheadTimeS: number;
  protected idleThresholdS: number;
  protected ballSpeedMultiplier: number;
  protected preparationTimeS: number;

  constructor() {
    // Load configuration from registry
    this.widthFactor =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[this.name]
        .widthPercentFactor / 100.0;

    this.lookAheadTimeS =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[this.name].lookAheadTimeS;

    this.idleThresholdS =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[this.name].idleThresholdS;

    this.ballSpeedMultiplier =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[
        this.name
      ].ballSpeedMultiplier;

    this.preparationTimeS =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[this.name].preparationTimeS;
  }

  nextPositions(
    ai: PongAIOpponent,
    gameState: PongGameState,
  ): PongPaddlePosition[] {
    const serverTickrateS = ai.getGame().getServerTickrateS();
    const aiId = ai.getId();
    const paddle = gameState.paddles[aiId];

    // Speed up the ball for prediction purposes
    gameState.balls.forEach((ball) => {
      ball.doGoal = false;
      // Increase ball speed to compensate for AI's slower update rate
      ball.speed *= this.ballSpeedMultiplier;
    });

    // Look ahead for wall collisions with the sped-up ball
    const wallCollisions: ExtendedCollisionData[] = ai
      .getGame()
      .findNextCollisions(
        gameState,
        this.lookAheadTimeS * serverTickrateS,
        2 * aiId,
        "wall",
      );

    // Sort collisions by tick time
    const collisions = [...wallCollisions].sort((a, b) => a.tick - b.tick);

    // If no collisions found, or collision is far away, return to center position
    if (
      collisions.length === 0 ||
      collisions[0].tick > this.idleThresholdS * serverTickrateS
    ) {
      return [
        {
          displacement: 0,
          timestamp: Date.now(),
        },
      ];
    }

    // Calculate paddle properties
    const deltaX = paddle.speed * paddle.dx;
    const deltaY = paddle.speed * paddle.dy;
    const paddleHalfWidth = (paddle.coverage * this.widthFactor) / 2.0;

    const desiredPositions: PongPaddlePosition[] = [];
    const now = Date.now();

    // Calculate maximum time required to move across the entire field
    const maxMovementTime =
      (2 * paddle.maxDisplacement * 1000) / (paddle.speed * serverTickrateS);

    // Adjust collision time to account for the ball speed multiplier
    const timeAdjustmentFactor = 1 / this.ballSpeedMultiplier;

    // Process each collision to determine optimal paddle positions
    collisions.forEach((colData, index) => {
      // Calculate adjusted collision timestamp (accounting for sped-up simulation)
      const collisionTimestamp =
        now + (colData.tick * 1000.0 * timeAdjustmentFactor) / serverTickrateS;

      // Calculate target position based on collision position
      const possibleDisplacement = [
        (colData.collisionPos.x - paddle.x) / deltaX,
        (colData.collisionPos.y - paddle.y) / deltaY,
      ].filter((value) => isFinite(value) && value !== 0);

      const targetPosition =
        possibleDisplacement.length > 0
          ? possibleDisplacement[0]
          : paddle.displacement;

      // Clamp to allowed range
      let computedDisplacement = Math.max(
        -paddle.maxDisplacement,
        Math.min(paddle.maxDisplacement, targetPosition),
      );

      // Check if we need to move at all based on paddle width tolerance
      if (
        computedDisplacement >= paddle.displacement - paddleHalfWidth &&
        computedDisplacement <= paddle.displacement + paddleHalfWidth
      ) {
        // We're close enough, use current position to avoid unnecessary movement
        computedDisplacement = paddle.displacement;
      }

      // Filter out positions that are too close in time to previous positions
      const previousPosition = desiredPositions[desiredPositions.length - 1];

      // Only add this position if there's enough time to move from the previous position
      // Use an adaptive time calculation based on the distance to travel
      if (!previousPosition) {
        desiredPositions.push({
          displacement: computedDisplacement,
          timestamp: collisionTimestamp,
        });
      } else {
        // Calculate time needed to move between positions
        const distanceToTravel = Math.abs(
          computedDisplacement - previousPosition.displacement,
        );
        const timeNeededForMovement =
          (distanceToTravel / (2 * paddle.maxDisplacement)) * maxMovementTime;

        // Only add if there's enough time to make this movement
        if (
          collisionTimestamp - previousPosition.timestamp >
          timeNeededForMovement
        ) {
          desiredPositions.push({
            displacement: computedDisplacement,
            timestamp: collisionTimestamp,
          });
        }
      }

      // If this is the last collision, add a position that prepares for the next likely collision
      if (index === collisions.length - 1) {
        // Move toward center with a slight bias based on current position
        // (prevents oscillation and provides more natural movement)
        const centerBias = Math.sign(computedDisplacement) * 0.3;
        const preparationDisplacement = computedDisplacement * 0.5 - centerBias;

        // Clamp preparation displacement to valid range
        const clampedPreparationDisplacement = Math.max(
          -paddle.maxDisplacement,
          Math.min(paddle.maxDisplacement, preparationDisplacement),
        );

        // Calculate correct preparation timestamp based on the last collision
        const preparationTimestamp =
          collisionTimestamp + this.preparationTimeS * 1000;

        desiredPositions.push({
          displacement: clampedPreparationDisplacement,
          timestamp: preparationTimestamp,
        });
      }
    });

    console.log(`Collisions:`);
    console.dir(collisions, { depth: null });
    console.log(`Desired positions:`);
    console.dir(desiredPositions, { depth: null });

    return desiredPositions;
  }
}
