import { Rectangle } from "./rectangle";

export interface Paddle extends Rectangle {
  velocity: number;
  speed: number;
  speedWidthPercent: number;
  displacement: number;
  coverage: number;
  doMove: boolean;
}
