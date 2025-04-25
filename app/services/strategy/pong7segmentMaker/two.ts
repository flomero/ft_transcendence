import { Rectangle } from "../../../types/games/pong/rectangle";
import { IPong7segmentMaker } from "../../../types/strategy/IPong7segmentMaker";
import { StrategyManager } from "../strategyManager";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class Two implements IPong7segmentMaker {
  name = "two";

  protected verticalStripMaker: StrategyManager<
    IPong7segmentMaker,
    "sampleRectangles"
  >;
  protected horizontalStripMaker: StrategyManager<
    IPong7segmentMaker,
    "sampleRectangles"
  >;

  protected totalVericalLength: number;
  protected totalHorizontalLength: number;

  protected padding: number;

  constructor() {
    this.verticalStripMaker = new StrategyManager(
      "verticalStrip",
      "pong7segmentMaker",
      "sampleRectangles",
    );

    this.horizontalStripMaker = new StrategyManager(
      "horizontalStrip",
      "pong7segmentMaker",
      "sampleRectangles",
    );

    const verticalStripHeight =
      STRATEGY_REGISTRY.pong7segmentMaker["verticalStrip"].stripHeight;
    const verticalStripWidth =
      STRATEGY_REGISTRY.pong7segmentMaker["verticalStrip"].stripWidth;
    this.totalVericalLength = verticalStripHeight + verticalStripWidth;

    const horizontalStripHeight =
      STRATEGY_REGISTRY.pong7segmentMaker["horizontalStrip"].stripHeight;
    const horizontalStripWidth =
      STRATEGY_REGISTRY.pong7segmentMaker["horizontalStrip"].stripWidth;
    this.totalHorizontalLength = horizontalStripHeight + horizontalStripWidth;

    this.padding = STRATEGY_REGISTRY.pong7segmentMaker[this.name].padding;
  }

  sampleRectangles(center: [number, number]): Rectangle[] {
    let rectangles: Rectangle[] = [];

    //  -
    //   |
    //  -
    // |
    //  -

    rectangles.push(
      ...this.horizontalStripMaker.executeStrategy([
        center[0],
        center[1] - this.totalVericalLength - this.padding,
      ]),
    );
    rectangles.push(
      ...this.verticalStripMaker.executeStrategy([
        center[0] + this.totalHorizontalLength / 2.0 + this.padding / 2.0,
        center[1] - this.totalVericalLength / 2.0 - this.padding / 2.0,
      ]),
    );
    rectangles.push(
      ...this.horizontalStripMaker.executeStrategy([center[0], center[1]]),
    );
    rectangles.push(
      ...this.verticalStripMaker.executeStrategy([
        center[0] - this.totalHorizontalLength / 2.0 - this.padding / 2.0,
        center[1] + this.totalVericalLength / 2.0 + this.padding / 2.0,
      ]),
    );
    rectangles.push(
      ...this.horizontalStripMaker.executeStrategy([
        center[0],
        center[1] + this.totalVericalLength + this.padding,
      ]),
    );

    return rectangles;
  }
}
