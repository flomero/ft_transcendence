import { ExtendedCollisionData } from "../../../types/games/pong/extendedCollisionData";
import {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import { PongGameState } from "../../games/pong/pong";
import { PongAIOpponent } from "../../games/pong/pongAIOpponent";

export class Naive implements IPongPaddlePositionSampler {
  name = "naive";

  nextPositions(
    ai: PongAIOpponent,
    gameState: PongGameState,
  ): PongPaddlePosition[] {
    const serverTickrateS = ai.getGame().getServerTickrateS();

    // Make sure that simulating ticks won't pickup powerUps or score goals.
    gameState.balls[0].doGoal = false;

    const collisionData: ExtendedCollisionData[] = ai
      .getGame()
      .findNextCollisions(
        gameState,
        3 * serverTickrateS,
        2 * ai.getId(),
        "wall",
      );

    if (collisionData.length === 0)
      return [
        {
          displacement: 0,
          timestamp: Date.now(),
        },
      ];

    const desiredPositions: PongPaddlePosition[] = [];

    collisionData.forEach((collisionData) => {
      const collisionTimestamp =
        Date.now() + (collisionData.tick * 1000.0) / serverTickrateS;

      const paddle = gameState.paddles[ai.getId()];

      // (paddle.x, paddle.y) => paddle.displacement
      // delta x = paddle.speed * paddle.dx
      // delta y = paddle.speed * paddle.dy
      //
      // E: x = displacement * delta x
      // E: y = displacement * delta y
      //
      // desiredPos  => ? desiredDisplacement ?
      const deltaX = paddle.speed * paddle.dx;
      const deltaY = paddle.speed * paddle.dy;

      const desiredDisplacement = [
        (collisionData.collisionPos.x - paddle.x) / deltaX,
        (collisionData.collisionPos.y - paddle.y) / deltaY,
      ].filter((value) => value !== Infinity);

      if (desiredDisplacement.length !== 0) {
        desiredPositions.push({
          displacement: desiredDisplacement[0],
          timestamp: collisionTimestamp,
        });
      }
    });

    return desiredPositions;
  }
}
