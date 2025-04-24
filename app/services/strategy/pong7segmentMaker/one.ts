import { Rectangle } from "../../../types/games/pong/rectangle";
import { IPong7segmentMaker } from "../../../types/strategy/IPong7segmentMaker";
import { StrategyManager } from "../strategyManager";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class One implements IPong7segmentMaker {
  name = "one";

  protected verticalStripMaker: StrategyManager<
    IPong7segmentMaker,
    "sampleRectangles"
  >;
  protected totalVerticalLength: number;
  protected padding: number;

  constructor() {
    this.verticalStripMaker = new StrategyManager(
      "verticalStrip",
      "pong7segmentMaker",
      "sampleRectangles",
    );

    const verticalStripHeight =
      STRATEGY_REGISTRY.pong7segmentMaker["verticalStrip"].stripHeight;
    const verticalStripWidth =
      STRATEGY_REGISTRY.pong7segmentMaker["verticalStrip"].stripWidth;
    this.totalVerticalLength = verticalStripHeight + verticalStripWidth;

    this.padding = STRATEGY_REGISTRY.pong7segmentMaker[this.name].padding;
  }

  sampleRectangles(center: [number, number]): Rectangle[] {
    let rectangles: Rectangle[] = [];

    // TOP STRIP
    rectangles.push(
      ...this.verticalStripMaker.executeStrategy([
        center[0],
        center[1] - this.totalVerticalLength / 2.0 - this.padding,
      ]),
    );
    // BOTTOM STRIP
    rectangles.push(
      ...this.verticalStripMaker.executeStrategy([
        center[0],
        center[1] + this.totalVerticalLength / 2.0 + this.padding,
      ]),
    );

    return rectangles;
  }
}
