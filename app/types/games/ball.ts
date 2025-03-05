import { GameObject } from "./gameObject";

export interface Ball extends GameObject {
  speed: number;
  doCollision: boolean;
  isVisible: boolean;
}
