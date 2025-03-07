import { GameObject } from "./gameObject";

export interface Rectangle extends GameObject {
  absX: number;
  absY: number;
  nx: number;
  ny: number;
  width: number;
  height: number;
  alpha: number;
  isVisible: boolean;
  isGoal: boolean;
}
