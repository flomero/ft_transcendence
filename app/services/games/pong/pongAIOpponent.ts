import { type AIData, AIOpponent } from "../aiOpponent";
import { StrategyManager } from "../../strategy/strategyManager";
import type {
  IPongPaddlePositionSampler,
  PongPaddlePosition,
} from "../../../types/strategy/IPongPaddlePositionSampler";
import type { UserInput } from "../../../types/games/userInput";
import type { Pong } from "./pong";
import type { PongGameState } from "../../../types/games/pong/gameState";

interface MovementInterval {
  type: "UP" | "DOWN";
  start: number;
  stop: number;
}

export class PongAIOpponent extends AIOpponent {
  protected inputQueue: UserInput[] = [];

  protected gameState: PongGameState;
  protected paddlePositionSampler: StrategyManager<
    IPongPaddlePositionSampler,
    "nextPositions"
  >;

  constructor(game: any, data: AIData) {
    super(game, data);

    this.data = data;
    this.gameState = JSON.parse(JSON.stringify(game.getState()));
    this.paddlePositionSampler = new StrategyManager(
      this.data.strategyName,
      "pongPaddlePositionSampler",
      "nextPositions",
    );

    this.startActionScheduler();
  }

  update(): void {
    const gameState: PongGameState = (this.game as Pong).getState();
    this.gameState = JSON.parse(
      JSON.stringify({
        ...gameState,
        balls: gameState.balls.filter((ball) => ball.doGoal && ball.isVisible),
      }),
    );

    const absoluteSamples: PongPaddlePosition[] =
      this.paddlePositionSampler.executeStrategy(this, this.gameState);
    this.inputQueue = this.translateSamples(absoluteSamples);
  }

  protected translateSamples(
    absoluteSamples: PongPaddlePosition[],
  ): UserInput[] {
    const inputs: UserInput[] = [];

    const paddle = this.gameState.paddles[this.data.playerId];

    // Convert each displacement sample into a movement interval.
    const intervals: MovementInterval[] = absoluteSamples.map((sample) => {
      const deltaDisplacement = sample.displacement - paddle.displacement;
      // Paddle speed in displacement per millisecond.
      const paddleSpeedMs = (paddle.speed * this.game.serverTickrateS) / 1000.0;
      // Time needed to cover the required displacement.
      const timeNeeded = Math.abs(deltaDisplacement) / paddleSpeedMs;
      // Original computed start time.
      const computedStart = sample.timestamp - timeNeeded;
      // If computed start is in the past, start immediately.
      const actualStart =
        computedStart < Date.now() ? Date.now() : computedStart;
      // Adjust stop time to always honor the movement duration.
      const actualStop =
        computedStart < Date.now() ? Date.now() + timeNeeded : sample.timestamp;
      const direction: "UP" | "DOWN" = deltaDisplacement > 0 ? "UP" : "DOWN";
      return {
        type: direction,
        start: actualStart,
        stop: actualStop,
      };
    });

    // Sort intervals by their start time.
    intervals.sort((a, b) => a.start - b.start);

    // Merge overlapping or consecutive intervals that share the same direction.
    const mergedIntervals: MovementInterval[] = [];
    for (const intv of intervals) {
      const last = mergedIntervals[mergedIntervals.length - 1];
      if (last && last.type === intv.type && intv.start <= last.stop) {
        // Extend the previous interval if needed.
        last.stop = Math.max(last.stop, intv.stop);
      } else {
        mergedIntervals.push({ ...intv });
      }
    }

    // Translate merged intervals into input commands.
    for (const intv of mergedIntervals) {
      inputs.push({
        type: intv.type,
        playerId: this.data.playerId,
        timestamp: intv.start,
      });
      inputs.push({
        type: "STOP_UP",
        playerId: this.data.playerId,
        timestamp: intv.stop,
      });
      inputs.push({
        type: "STOP_DOWN",
        playerId: this.data.playerId,
        timestamp: intv.stop,
      });
    }

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

  getGame(): Pong {
    return this.game;
  }
}
