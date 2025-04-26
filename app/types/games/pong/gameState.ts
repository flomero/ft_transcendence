import type { Ball } from "./ball";
import type { Paddle } from "./paddle";
import type { Rectangle } from "./rectangle";
import type { RNG } from "../../../services/games/rng";
import type { GameBaseState } from "../gameBaseState";

export type PongGameState = GameBaseState & {
  balls: Ball[];
  paddles: Paddle[];
  walls: Rectangle[];
  rng: RNG;
  lastHit: number;
  lastGoal: number;
  scores: number[];
  results: number[];
  playerCount: number;
  modifiersState?: Record<string, any>;
};
