import type { AIOpponent } from "../../services/games/aiOpponent";
import type { PongGameState } from "../games/pong/gameState";

export interface PongPaddlePosition {
  displacement: number;
  timestamp: number;
}

export interface IPongPaddlePositionSampler {
  nextPositions(ai: AIOpponent, gameState: PongGameState): PongPaddlePosition[];
}
