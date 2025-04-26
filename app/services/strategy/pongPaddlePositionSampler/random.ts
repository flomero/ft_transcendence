import type {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import type { AIOpponent } from "../../games/aiOpponent";
import type { PongGameState } from "../../games/pong/pong";

export class Random implements IPongPaddlePositionSampler {
  name = "random";

  nextPositions(
    ai: AIOpponent,
    gameState: PongGameState,
  ): PongPaddlePosition[] {
    const rndSign = ai.getRNG().randomSign();
    const rndDisplacement =
      ai.getRNG().random() * gameState.paddles[ai.getId()].maxDisplacement;
    const rndDeltaTime = ai.getRNG().randomInt(0, 999);

    return [
      {
        displacement: rndSign * rndDisplacement,
        timestamp: Date.now() + rndDeltaTime,
      },
    ];
  }
}
