export const pongUserInputs = {
  UP: "UP",
  STOP_UP: "STOP_UP",
  DOWN: "DOWN",
  STOP_DOWN: "STOP_DOWN",
  SPACE: "SPACE",
  STOP_SPACE: "STOP_SPACE",
};

export interface UserInput {
  type: string;
  playerId: number;
  timestamp: number;
}
