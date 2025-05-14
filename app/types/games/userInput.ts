import { PongMinimalGameState } from "./pong/gameState";

export const pongUserInputs = {
  UP: "UP",
  STOP_UP: "STOP_UP",
  DOWN: "DOWN",
  STOP_DOWN: "STOP_DOWN",
  SPACE: "SPACE",
  STOP_SPACE: "STOP_SPACE",
  LOCAL_UP: "LOCAL_UP",
  LOCAL_DOWN: "LOCAL_DOWN",
  LOCAL_STOP_UP: "LOCAL_STOP_UP",
  LOCAL_STOP_DOWN: "LOCAL_STOP_DOWN",
} as const;

export type PongUserInput =
  (typeof pongUserInputs)[keyof typeof pongUserInputs];

export interface UserInput {
  type?: PongUserInput;
  playerId: number;
  timestamp: number;
  isLocal?: boolean;
}

export interface GameMessage {
  type: "userInput";
  options: UserInput;
}

export type GameStateMessage = {
  type: "gameState";
  data: PongMinimalGameState;
  referenceTable: string[];
};

export type ServerMessage =
  | GameStateMessage
  | { type: "gameFinished" | "redirect"; data: string };
