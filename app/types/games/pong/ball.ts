import { GameObject } from "./gameObject";

export interface Ball extends GameObject {
  radius: number;
  speed: number;
  doCollision: boolean;
  isVisible: boolean;
  doGoal: boolean;
}
