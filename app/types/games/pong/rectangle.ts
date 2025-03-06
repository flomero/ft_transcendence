import { GameObject } from "./gameObject";

export interface Rectangle extends GameObject {
  nx: number;
  ny: number;
  width: number;
  height: number;
  isVisible: boolean;
}
