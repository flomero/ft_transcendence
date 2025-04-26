import type { ExtendedCollisionData } from "../../../types/games/pong/extendedCollisionData";
import type {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import type { PongGameState } from "../../games/pong/pong";
import type { PongAIOpponent } from "../../games/pong/pongAIOpponent";
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
      .findNextCollisions(gameState, serverTickrateS, 2 * ai.getId(), "wall");

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

    // ADD TO REGISTRY
    const idleFactor = 85 / 100.0;

    if (paddle.displacement !== 0) {
      // Compute time required to move back to the idle position
      let timeNeeded = Math.abs(paddle.displacement) / paddle.speed;

      // Compute how much time from idle to first collision
      let travelTime = Math.round(
        Math.abs(desiredPositions[0].displacement) / paddle.speed + 0.5,
      );

      // Compute the total travel time, to idle, from idle to collision.
      let totalTravelTime = timeNeeded + travelTime;

      // Go idle if there's enough time
      if (totalTravelTime < idleFactor * collisionData[0].tick) {
        desiredPositions.unshift({
          displacement: 0,
          timestamp: Date.now() + (timeNeeded * 1000.0) / serverTickrateS,
        });
      }
    }

    const lastCollisionId = collisionData.length - 1;
    // Compute time needed from last collision to idle
    let timeNeeded = Math.round(
      Math.abs(desiredPositions[lastCollisionId].displacement) / paddle.speed +
        0.5,
    );

    desiredPositions.push({
      displacement: 0,
      timestamp:
        desiredPositions[lastCollisionId].timestamp +
        (timeNeeded * 1000.0) / serverTickrateS,
    });

    return desiredPositions;
  }
}
