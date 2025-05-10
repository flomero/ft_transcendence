import type { Ball } from "./ball";
import type { Paddle } from "./paddle";
import type { Rectangle } from "./rectangle";
import type { RNG } from "../../../services/games/rng";
import type { GameBaseState } from "../gameBaseState";

export type BallState = {
  r: number;
  x: number;
  y: number;
};

export type PaddleState = {
  a: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WallState = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  doRot: boolean;
};

export type ModifierState = {
  ticks: number;
  duration: number;
};

export type ModifiersState = {
  spawnedPowerUps: { [powerUpName: string]: BallState[] };
  modifiers: { [modifierName: string]: ModifierState };
};

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
  eliminatedPlayers: number[];
  modifiersState?: Record<string, any>;
};

export type PongMinimalGameState = {
  balls: BallState[];
  paddles: PaddleState[];
  walls: WallState[];
  scores: number[];
  modifiersState: ModifiersState;
};
