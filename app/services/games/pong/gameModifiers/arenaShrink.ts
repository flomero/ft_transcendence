import { Pong } from "../pong";
import { Rectangle } from "../../../../types/games/pong/rectangle";
import { ModifierBase } from "../../modifierBase";

const coefficients: { [playerCount: number]: number } = {
  5: 3.1,
  6: 2.4,
  7: 1.5,
  8: 1.31,
};

export class ArenaShrink extends ModifierBase {
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

    // If a non-goal wall is surrounded by 2 players that got eliminated, hide it.
    // Check whether adjacent players are eliminated
    const adjacentPlayerStatus = [-1, 1].filter((offset) => {
      const index =
        (args.playerId + offset + gameState.playerCount) %
        gameState.playerCount;
      return gameState.results[index] !== 0;
    });

    if (!this.shrunkIds.includes(wallIds[0])) {
      gameState.walls[wallIds[0]].width /= 2.0;
      gameState.walls[wallIds[0]].x +=
        (gameState.walls[wallIds[0]].dx * gameState.walls[wallIds[0]].width) /
        2.0;
      gameState.walls[wallIds[0]].y +=
        (gameState.walls[wallIds[0]].dy * gameState.walls[wallIds[0]].width) /
        2.0;
      this.shrunkIds.push(wallIds[0]);
    }

    gameState.walls[wallIds[1]] = shrunkWall;

    if (!this.shrunkIds.includes(wallIds[2])) {
      gameState.walls[wallIds[2]].width /= 2.0;
      gameState.walls[wallIds[2]].x -=
        (gameState.walls[wallIds[2]].dx * gameState.walls[wallIds[2]].width) /
        2.0;
      gameState.walls[wallIds[2]].y -=
        (gameState.walls[wallIds[2]].dy * gameState.walls[wallIds[2]].width) /
        2.0;
      this.shrunkIds.push(wallIds[2]);
    }

    // Process walls when adjacent players are eliminated
    for (const adjacent of adjacentPlayerStatus) {
      // Get the adjacent player's ID
      const adjacentPlayerId =
        (args.playerId + adjacent + gameState.playerCount) %
        gameState.playerCount;

      // Get the main walls (even IDs) of the current player and adjacent player
      const currentMainWallId = args.playerId * 2;
      const adjacentMainWallId = adjacentPlayerId * 2;

      // Get the wall between them (odd ID)
      const connectingWallId =
        (2 * args.playerId + adjacent + 2 * gameState.playerCount) %
        (2 * gameState.playerCount);

      const currentMainWall = gameState.walls[currentMainWallId];
      const adjacentMainWall = gameState.walls[adjacentMainWallId];
      const connectingWall = gameState.walls[connectingWallId];

      const angleDiff = Math.abs(currentMainWall.alpha - connectingWall.alpha);

      const widthDiff = (Math.cos(angleDiff) * connectingWall.width) / 2.0;
      const normalDiff = connectingWall.height / Math.cos(angleDiff);

      currentMainWall.width -=
        (widthDiff * coefficients[gameState.playerCount]) / 2.0;
      currentMainWall.x -= (adjacent * currentMainWall.dx * widthDiff) / 2.0;
      currentMainWall.y -= (adjacent * currentMainWall.dy * widthDiff) / 2.0;

      adjacentMainWall.width -=
        (widthDiff * coefficients[gameState.playerCount]) / 2.0;
      adjacentMainWall.x += (adjacent * adjacentMainWall.dx * widthDiff) / 2.0;
      adjacentMainWall.y += (adjacent * adjacentMainWall.dy * widthDiff) / 2.0;

      // Adjust the connecting wall position to create a continuous barrier
      connectingWall.x +=
        adjacent * ((connectingWall.dx * connectingWall.width) / 2.0) +
        connectingWall.nx * coefficients[gameState.playerCount] * normalDiff;
      connectingWall.y +=
        adjacent * ((connectingWall.dy * connectingWall.width) / 2.0) +
        connectingWall.ny * coefficients[gameState.playerCount] * normalDiff;
    }

    game.getModifierManager().trigger("onArenaModification");
  }
}
