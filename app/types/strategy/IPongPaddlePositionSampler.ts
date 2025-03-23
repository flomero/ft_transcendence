import { AIOpponent } from "../../services/games/aiOpponent";

export interface PongPaddlePosition {
  displacement: number;
  timestamp: number;
}

export interface IPongPaddlePositionSampler {
  nextPositions(
    ai: AIOpponent,
    gameState: Record<string, any>,
  ): PongPaddlePosition[];
}
