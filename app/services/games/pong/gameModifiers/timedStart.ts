import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { IPong7segmentMaker } from "../../../../types/strategy/IPong7segmentMaker";
import { StrategyManager } from "../../../strategy/strategyManager";
import { TimeLimitedModifierBase } from "../../timeLimitedModifierBase";
import { Pong } from "../pong";

enum Digit {
  ONE,
  TWO,
  THREE,
}

export class TimedStart extends TimeLimitedModifierBase {
  name = "timedStart";

  protected digitMaker: StrategyManager<IPong7segmentMaker, "sampleRectangles">;
  protected currentDigit: Digit = Digit.THREE;
  protected center: [number, number] = [0, 0];

  constructor() {
    super();

    this.duration = GAME_REGISTRY.pong.serverTickrateS; // delay of 1 second

    this.digitMaker = new StrategyManager(
      "three",
      "pong7segmentMaker",
      "sampleRectangles",
    );
  }

  onGameStart(game: Pong): void {
    game.getState().balls[0].isVisible = false;
    game.getState().balls[0].speed = 0;

    this.center = [
      game.getSettings().arenaWidth / 2.0,
      game.getSettings().arenaHeight / 2.0,
    ];

    game.getState().walls.push(...this.digitMaker.executeStrategy(this.center));
  }

  onDeactivation(game: Pong): void {
    switch (this.currentDigit) {
      case Digit.THREE: {
        const gameState = game.getState();
        this.digitMaker.setStrategy("two");
        gameState.walls = [
          ...gameState.walls.slice(0, 2 * gameState.playerCount),
          ...this.digitMaker.executeStrategy(this.center),
        ];
        this.currentDigit = Digit.TWO;
        this.activate(game);
        break;
      }

      case Digit.TWO: {
        const gameState = game.getState();
        this.digitMaker.setStrategy("one");
        gameState.walls = [
          ...gameState.walls.slice(0, 2 * gameState.playerCount),
          ...this.digitMaker.executeStrategy(this.center),
        ];
        this.currentDigit = Digit.ONE;
        this.activate(game);
        break;
      }

      case Digit.ONE: {
        const gameState = game.getState();
        gameState.walls = [
          ...gameState.walls.slice(0, 2 * gameState.playerCount),
        ];
        game.resetBall(gameState, -1, true);
        break;
      }
    }
  }
}
