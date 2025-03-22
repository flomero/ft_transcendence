import type { Rectangle } from "./rectangle";

export interface Paddle extends Rectangle {
  velocity: number;
  speed: number;
  displacement: number;
  coverage: number;
  doMove: boolean;
  [key: string]: any;
}
