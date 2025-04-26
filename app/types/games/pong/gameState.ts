import type { Ball } from "./ball";
import type { Paddle } from "./paddle";
import type { Rectangle } from "./rectangle";
import type { IRNG } from "../rng";
import type { GameBaseState } from "../gameBaseState";

export type PongGameState = GameBaseState & {
  balls: Ball[];
  paddles: Paddle[];
  walls: Rectangle[];
  rng: IRNG;
  lastHit: number;
  lastGoal: number;
  scores: number[];
  results: number[];
  playerCount: number;
  eliminatedPlayers: number[];
  modifiersState?: Record<string, any>;
};
