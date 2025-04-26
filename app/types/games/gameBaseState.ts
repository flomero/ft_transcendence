export enum GameStatus {
  CREATED = 0,
  RUNNING = 1,
  PAUSED = 2,
  FINISHED = 3,
}

export interface GameBaseState {
  startDate: number;
  lastUpdate: number;
  status: GameStatus;
}
