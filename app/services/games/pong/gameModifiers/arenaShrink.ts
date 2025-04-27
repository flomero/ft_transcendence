import type { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import { ModifierBase } from "../../modifierBase";

export class ArenaShrink extends ModifierBase {
  name = "arenaShrink";

  shrunkIds: number[] = [];

  onResultUpdate(game: Pong, args: { playerId: number }): void {
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

    // If a non-goal wall is surrounded by 2 players that got eliminated, hide it.
    // Check whether adjacent players are eliminated
    const adjacentPlayerStatus = [-1, 1].filter((offset) => {
      const index =
        (args.playerId + offset + gameState.playerCount) %
        gameState.playerCount;
      return gameState.results[index] !== 0;
    });

    adjacentPlayerStatus.forEach((id) => {
      const adjacentWallID =
        (wallIds[1] + id + 2 * gameState.playerCount) %
        (2 * gameState.playerCount);

      // Along direction
      gameState.walls[adjacentWallID].x +=
        (id *
          gameState.walls[adjacentWallID].dx *
          gameState.walls[adjacentWallID].width) /
        2.0;
      gameState.walls[adjacentWallID].y +=
        (id *
          gameState.walls[adjacentWallID].dy *
          gameState.walls[adjacentWallID].width) /
        2.0;

      // Along normal
      gameState.walls[adjacentWallID].x +=
        (gameState.walls[adjacentWallID].nx *
          gameState.walls[adjacentWallID].width) /
        2.0;
      gameState.walls[adjacentWallID].y +=
        (gameState.walls[adjacentWallID].ny *
          gameState.walls[adjacentWallID].width) /
        2.0;
    });

    this.updateWalls(game);
    game.getModifierManager().trigger("onArenaModification");
  }

  protected updateWalls(game: Pong) {
    const walls = game
      .getState()
      .walls.slice(0, 2 * game.getState().playerCount);
    const totalWalls = walls.length;

    // Only process even-indexed walls
    for (let i = 0; i < totalWalls; i += 2) {
      const currentWall = walls[i];

      // Get the wall before and after (odd-indexed walls that remain fixed)
      const prevWallIndex = (i - 1 + totalWalls) % totalWalls;
      const nextWallIndex = (i + 1) % totalWalls;

      const prevWall = walls[prevWallIndex];
      const nextWall = walls[nextWallIndex];

      // Get the corners of the fixed odd walls that we need to connect to
      // For prevWall, we need its bottom-right corner (+direction, -normal)
      const prevWallCorner = {
        x:
          prevWall.x +
          (prevWall.dx * prevWall.width) / 2 -
          (prevWall.nx * prevWall.height) / 2,
        y:
          prevWall.y +
          (prevWall.dy * prevWall.width) / 2 -
          (prevWall.ny * prevWall.height) / 2,
      };

      // For nextWall, we need its bottom-left corner (-direction, -normal)
      const nextWallCorner = {
        x:
          nextWall.x -
          (nextWall.dx * nextWall.width) / 2 -
          (nextWall.nx * nextWall.height) / 2,
        y:
          nextWall.y -
          (nextWall.dy * nextWall.width) / 2 -
          (nextWall.ny * nextWall.height) / 2,
      };

      // Calculate the midpoint between the corners
      const midX = (prevWallCorner.x + nextWallCorner.x) / 2;
      const midY = (prevWallCorner.y + nextWallCorner.y) / 2;

      // Calculate the vector between the corners
      let dx = nextWallCorner.x - prevWallCorner.x;
      let dy = nextWallCorner.y - prevWallCorner.y;
      const width = Math.sqrt(dx ** 2 + dy ** 2) || 1;
      dx /= width;
      dy /= width;

      currentWall.width = width;
      currentWall.dx = dx;
      currentWall.dy = dy;
      currentWall.nx = -dy;
      currentWall.ny = dx;

      // Set the center position of the current wall
      // Since we're connecting the bottom edges, we need to offset by half the height
      // in the normal direction to get the center
      currentWall.x = midX + (currentWall.nx * currentWall.height) / 2;
      currentWall.y = midY + (currentWall.ny * currentWall.height) / 2;
    }
  }
}
