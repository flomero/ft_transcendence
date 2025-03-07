import { Rectangle } from "./rectangle";

export interface Paddle extends Rectangle {
  velocity: number;
  speed: number;
  displacement: number;
  coverage: number;
  doMove: boolean;
  isGoal: false;
}
