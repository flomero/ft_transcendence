import { AIOpponent } from "../../services/games/aiOpponent";
import { PongGameState } from "../../services/games/pong/pong";

export interface PongPaddlePosition {
  displacement: number;
  timestamp: number;
}

export interface IPongPaddlePositionSampler {
  nextPositions(ai: AIOpponent, gameState: PongGameState): PongPaddlePosition[];
}
