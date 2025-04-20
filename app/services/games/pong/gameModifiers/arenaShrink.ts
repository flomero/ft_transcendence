import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { Rectangle } from "../../../../types/games/pong/rectangle";

export class ArenaShrink extends PongModifierBase {
  name = "arenaShrink";

  shrunkIds: number[] = [];

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    const gameState = game.getState();
    const arenaRadius =
      game.getSettings().arenaRadius || game.getSettings().arenaWidth / 2.0;

    // Get the goal_wall & 2 surrounding walls
    const wallIds: number[] = [1, 0, -1].map(
      (off) =>
        (2 * args.playerId + off + 2 * gameState.playerCount) %
        (2 * gameState.playerCount),
    );

    this.shrunkIds.push(wallIds[1]);

    const walls = wallIds.map((id) => gameState.walls[id]);

    const leftmost = {
      x: walls[0]["absX"] + arenaRadius,
      y: walls[0]["absY"] + arenaRadius,
      absX: walls[0]["absX"],
      absY: walls[0]["absY"],
    };

    const rightmost = {
      x: walls[2]["absX"] + arenaRadius,
      y: walls[2]["absY"] + arenaRadius,
      absX: walls[2]["absX"],
      absY: walls[2]["absY"],
    };

    let shrunkWall: Rectangle = walls[1];
    shrunkWall["x"] = (leftmost["x"] + rightmost["x"]) / 2.0;
    shrunkWall["y"] = (leftmost["y"] + rightmost["y"]) / 2.0;
    shrunkWall["width"] = Math.sqrt(
      (rightmost["x"] - leftmost["x"]) ** 2 +
        (rightmost["y"] - leftmost["y"]) ** 2,
    );
    shrunkWall["isVisible"] = true;
    shrunkWall["absX"] = (leftmost["absX"] + rightmost["absX"]) / 2.0;
    shrunkWall["absY"] = (leftmost["absY"] + rightmost["absY"]) / 2.0;
    shrunkWall["isGoal"] = false;

    gameState.walls[wallIds[0]].width /= 1.05;
    gameState.walls[wallIds[1]] = shrunkWall;
    gameState.walls[wallIds[2]].width /= 1.05;

    // If a non-goal wall is surrounded by 2 players that got eliminated, hide it.
    // Check whether adjacent players are eliminated
    const adjacentPlayerStatus = [-1, 1].filter((offset) => {
      const index =
        (args.playerId + offset + gameState.playerCount) %
        gameState.playerCount;
      return gameState.results[index] !== 0;
    });

    // Hide the corresponding wall
    for (const adjacent of adjacentPlayerStatus) {
      const adjacentWallId =
        (2 * args.playerId + adjacent + 2 * gameState.playerCount) %
        (2 * gameState.playerCount);
      gameState.walls[adjacentWallId].isVisible = false;
    }
  }
}
