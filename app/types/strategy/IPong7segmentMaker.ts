import { Rectangle } from "../games/pong/rectangle";

export interface IPong7segmentMaker {
  sampleRectangles(center: [number, number]): Rectangle[];
}
