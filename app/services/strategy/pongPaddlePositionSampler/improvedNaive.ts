import { ExtendedCollisionData } from "../../../types/games/pong/extendedCollisionData";
import {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import { PongGameState } from "../../games/pong/pong";
import { PongAIOpponent } from "../../games/pong/pongAIOpponent";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class ImprovedNaive implements IPongPaddlePositionSampler {
  name = "improvedNaive";

  protected widthFactor: number;

  constructor() {
    this.widthFactor =
      STRATEGY_REGISTRY.pongPaddlePositionSampler[this.name]
        .widthPercentFactor / 100.0;
  }

  nextPositions(
    ai: PongAIOpponent,
    gameState: PongGameState,
  ): PongPaddlePosition[] {
    const serverTickrateS = ai.getGame().getServerTickrateS();
    // Ensure that simulating ticks won't trigger goal events or power-ups.
    gameState.balls[0].doGoal = false;

    // Look ahead for collisions with the wall up to 3 seconds.
    const collisionData: ExtendedCollisionData[] = ai
      .getGame()
      .findNextCollisions(
        gameState,
        3 * serverTickrateS,
        2 * ai.getId(),
        "wall",
      );

    // If no collisions found, return idle sample.
    if (collisionData.length === 0) {
      return [
        {
          displacement: 0,
          timestamp: Date.now(),
        },
      ];
    }

    const paddle = gameState.paddles[ai.getId()];
    // Compute the paddle's movement per tick along its current direction.
    const deltaX = paddle.speed * paddle.dx;
    const deltaY = paddle.speed * paddle.dy;

    // Compute the tolerance based on paddle width.
    const deltaDisplacement = (paddle.coverage * this.widthFactor) / 2.0;

    const desiredPositions: PongPaddlePosition[] = [];

    collisionData.forEach((colData) => {
      // Calculate the expected collision time.
      const collisionTimestamp =
        Date.now() + (colData.tick * 1000.0) / serverTickrateS;

      // Compute the raw displacement required to intercept the ball.
      const possibleDisplacement = [
        (colData.collisionPos.x - paddle.x) / deltaX,
        (colData.collisionPos.y - paddle.y) / deltaY,
      ].filter((value) => value !== Infinity);
      if (possibleDisplacement.length === 0) return;

      // Clamp it to the allowed range.
      let computedDisplacement = Math.max(
        -paddle.maxDisplacement,
        Math.min(paddle.maxDisplacement, possibleDisplacement[0]),
      );

      // If the computed displacement is within the tolerance range of the current paddle position,
      // then no movement is necessary.
      if (
        computedDisplacement >= paddle.displacement - deltaDisplacement &&
        computedDisplacement <= paddle.displacement + deltaDisplacement
      ) {
        computedDisplacement = paddle.displacement;
      } else {
        computedDisplacement = Math.min(
          computedDisplacement - deltaDisplacement,
          computedDisplacement + deltaDisplacement,
        );
      }

      desiredPositions.push({
        displacement: computedDisplacement,
        timestamp: collisionTimestamp,
      });
    });

    // Optionally add an idle sample before the first collision if there is a gap.
    const currentTime = Date.now();
    const idleThresholdMs = 200;
    if (
      desiredPositions.length > 0 &&
      desiredPositions[0].timestamp - currentTime > idleThresholdMs
    ) {
      desiredPositions.unshift({
        displacement: 0,
        timestamp: currentTime + idleThresholdMs,
      });
    }
    // Also add an idle sample after the last collision if there's a long gap.
    const lastSample = desiredPositions[desiredPositions.length - 1];
    if (lastSample.timestamp - currentTime > 1000) {
      desiredPositions.push({
        displacement: 0,
        timestamp: lastSample.timestamp + 300, // small delay before returning to center
      });
    }

    return desiredPositions;
  }
}
