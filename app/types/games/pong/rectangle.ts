import type { GameObject } from "./gameObject";

export interface Rectangle extends GameObject {
  absX: number;
  absY: number;
  nx: number;
  ny: number;
  width: number;
  height: number;
  alpha: number;
  isVisible: boolean;
  doCollision: boolean;
  doResolveCollision: boolean;
  doRotation: boolean;
  doBoundsProtection: boolean;
  [key: string]: any; // For addition data such as isGoal for Walls.
}
