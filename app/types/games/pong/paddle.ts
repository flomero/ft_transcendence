import type { Rectangle } from "./rectangle";

export interface Paddle extends Rectangle {
  velocity: number;
  speed: number;
  displacement: number;
  maxDisplacement: number;
  coverage: number;
  doMove: boolean;
  keyPressed: { [key: string]: boolean };
  [key: string]: any;
}
