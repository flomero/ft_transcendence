import {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import { AIOpponent } from "../../games/aiOpponent";

export class Random implements IPongPaddlePositionSampler {
  name = "random";

  nextPositions(
    ai: AIOpponent,
    gameState: Record<string, any>,
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
