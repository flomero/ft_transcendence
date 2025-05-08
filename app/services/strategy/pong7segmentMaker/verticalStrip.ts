import type { Rectangle } from "../../../types/games/pong/rectangle";
import type { IPong7segmentMaker } from "../../../types/strategy/IPong7segmentMaker";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class VerticalStrip implements IPong7segmentMaker {
  name = "verticalStrip";

  protected stripHeight: number = 0;
  protected stripWidth: number = 0;

  constructor() {
    this.stripHeight =
      STRATEGY_REGISTRY.pong7segmentMaker[this.name].stripHeight;
    this.stripWidth = STRATEGY_REGISTRY.pong7segmentMaker[this.name].stripWidth;
  }

  sampleRectangles(center: [number, number]): Rectangle[] {
    let rectangles: Rectangle[] = [];

    const ca = Math.cos(Math.PI / 4.0);
    const sa = Math.sin(Math.PI / 4.0);
    // d**2 = 2 * C**2 = this.stripWidth**2
    //   -> c = this.stripWidth / sqrt(2)
    const endsSize = this.stripWidth / Math.SQRT2;

    rectangles = [
      // MAIN STRIP
      {
        id: 0,
        x: center[0],
        y: center[1],
        absX: center[0],
        absY: center[1],
        alpha: 0.0,
        dx: 1,
        dy: 0,
        nx: 0,
        ny: 1,
        width: this.stripWidth,
        height: this.stripHeight,
        doCollision: false,
        doRotation: false,
        isVisible: true,
        doBoundsProtection: true,
      },

      // TOP END
      {
        id: 0,
        x: center[0],
        y: center[1] - this.stripHeight / 2.0,
        absX: center[0],
        absY: center[1] - this.stripHeight / 2.0,
        alpha: Math.PI / 4.0,
        dx: ca,
        dy: sa,
        nx: -sa,
        ny: ca,
        width: endsSize,
        height: endsSize,
        doCollision: false,
        doRotation: false,
        isVisible: true,
        doBoundsProtection: true,
      },

      // BOTTOM END
      {
        id: 0,
        x: center[0],
        y: center[1] + this.stripHeight / 2.0,
        absX: center[0],
        absY: center[1] + this.stripHeight / 2.0,
        alpha: Math.PI / 4.0,
        dx: ca,
        dy: sa,
        nx: -sa,
        ny: ca,
        width: endsSize,
        height: endsSize,
        doCollision: false,
        doRotation: false,
        isVisible: true,
        doBoundsProtection: true,
      },
    ];

    return rectangles;
  }
}
