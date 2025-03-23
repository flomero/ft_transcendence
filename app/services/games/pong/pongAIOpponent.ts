import { AIData, AIOpponent } from "../aiOpponent";
import { StrategyManager } from "../../strategy/strategyManager";
import {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import { UserInput } from "../../../types/games/userInput";

export class PongAIOpponent extends AIOpponent {
  protected inputQueue: UserInput[] = [];

  protected paddlePositionSampler: StrategyManager<
    IPongPaddlePositionSampler,
    "nextPositions"
  >;

  constructor(game: any, data: AIData) {
    super(game, data);

    this.data = data;
    this.paddlePositionSampler = new StrategyManager(
      this.data.strategyName,
      "pongPaddlePositionSampler",
      "nextPositions",
    );

    this.startActionScheduler();
  }

  update(): void {
    this.gameState = this.game.getStateSnapshot();

    const absoluteSamples: PongPaddlePosition[] =
      this.paddlePositionSampler.executeStrategy(this, this.gameState);
    this.inputQueue = this.translateSamples(absoluteSamples);
  }

  protected translateSamples(
    absoluteSamples: PongPaddlePosition[],
  ): UserInput[] {
    const inputs: UserInput[] = [];
    const paddle = this.gameState.paddles[this.data.playerId];

    absoluteSamples
      .map((sample) => {
        return {
          deltaDisplacement: sample.displacement - paddle.displacement,
          timestamp: sample.timestamp,
        };
      })
      .forEach((value) => {
        const paddleSpeedMs =
          (paddle.speed * this.game.serverTickrateS) / 1000.0;
        const timeNeeded = Math.abs(value.deltaDisplacement) / paddleSpeedMs;

        // Figure out when to start moving to end up stopping at the right position at the right time
        const startMovement: UserInput = {
          type: value.deltaDisplacement > 0 ? "UP" : "DOWN",
          playerId: this.data.playerId,
          timestamp: value.timestamp - timeNeeded,
        };

        // Stop moving as requested
        const stopMovement: UserInput = {
          type: "STOP",
          playerId: this.data.playerId,
          timestamp: value.timestamp,
        };

        inputs.push(startMovement, stopMovement);
      });

    return inputs;
  }

  startActionScheduler(): void {
    setInterval(() => {
      const now = Date.now();
      const readyInputs = this.inputQueue.filter(
        (input) => input.timestamp <= now,
      );

      readyInputs.forEach((input) => this.game.handleAction(input));

      this.inputQueue = this.inputQueue.filter(
        (input) => input.timestamp > now,
      );
    }, this.game.serverTickrateS / 1000.0);
  }
}
