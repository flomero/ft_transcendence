import { GameObject } from "./gameObject";

export interface Rectangle extends GameObject {
  width: number;
  height: number;
  isVisible: boolean;
}
