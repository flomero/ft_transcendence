import type { Pong } from "../pong";
import type { Rectangle } from "../../../../types/games/pong/rectangle";
import { ModifierBase } from "../../modifierBase";

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

    const wallsToUpdate: Rectangle[] = [];
    if (!this.shrunkIds.includes(wallIds[0])) {
      gameState.walls[wallIds[0]].width /= 2.0;
      this.shrunkIds.push(wallIds[0]);
      wallsToUpdate.push(gameState.walls[wallIds[0]]);
    }

    gameState.walls[wallIds[1]] = shrunkWall;

    if (!this.shrunkIds.includes(wallIds[2])) {
      gameState.walls[wallIds[2]].width /= 2.0;
      this.shrunkIds.push(wallIds[2]);
      wallsToUpdate.push(gameState.walls[wallIds[2]]);
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
      wallsToUpdate.push(
        gameState.walls[
          (args.playerId + id + gameState.playerCount) % gameState.playerCount
        ],
      );
    });

    this.updateWalls(wallsToUpdate);
    game.getModifierManager().trigger("onArenaModification");
  }

  protected updateWalls(walls: Rectangle[]) {
    // Calculate proper widths for walls to ensure they overlap correctly
    const totalWalls = walls.length;
    const newWidths: number[] = new Array(totalWalls);

    // First compute all new widths without modifying the walls
    for (let i = 0; i < totalWalls; i++) {
      const currentWall = walls[i];
      const nextWallIndex = (i + 1) % totalWalls;
      const nextWall = walls[nextWallIndex];

      const currentWallInfos = {
        x: currentWall.x - (currentWall.nx * currentWall.height) / 2.0,
        y: currentWall.y - (currentWall.ny * currentWall.height) / 2.0,
        vectorX: currentWall.dx,
        vectorY: currentWall.dy,
      };

      const nextWallInfos = {
        x: nextWall.x - (nextWall.nx * nextWall.height) / 2.0,
        y: nextWall.y - (nextWall.ny * nextWall.height) / 2.0,
        vectorX: -nextWall.dx,
        vectorY: -nextWall.dy,
      };

      // Compute intersection point between the two lines
      // Line 1: currentWallInfos.x + t * currentWallInfos.vectorX, currentWallInfos.y + t * currentWallInfos.vectorY
      // Line 2: nextWallInfos.x + s * nextWallInfos.vectorX, nextWallInfos.y + s * nextWallInfos.vectorY

      // Using the formula for line intersection:
      // det = cross(v1, v2) = v1.x * v2.y - v1.y * v2.x
      const det =
        currentWallInfos.vectorX * nextWallInfos.vectorY -
        currentWallInfos.vectorY * nextWallInfos.vectorX;

      // If det is close to 0, lines are parallel and won't intersect properly
      if (Math.abs(det) < 1e-10) {
        // Fallback to default width if no intersection
        newWidths[i] = currentWall.width;
        continue;
      }

      // Calculate vector between starting points
      const dx = nextWallInfos.x - currentWallInfos.x;
      const dy = nextWallInfos.y - currentWallInfos.y;

      // Calculate parameters t and s
      const t = (dx * nextWallInfos.vectorY - dy * nextWallInfos.vectorX) / det;

      // We only need t for the current wall to determine its width
      // The intersection point
      const intersectionX = currentWallInfos.x + t * currentWallInfos.vectorX;
      const intersectionY = currentWallInfos.y + t * currentWallInfos.vectorY;

      // Calculate distance from the wall's center to the intersection point
      const centerToIntersectionX = intersectionX - currentWall.x;
      const centerToIntersectionY = intersectionY - currentWall.y;

      // Project this vector onto the wall's direction vector
      const projectionLength =
        centerToIntersectionX * currentWallInfos.vectorX +
        centerToIntersectionY * currentWallInfos.vectorY;

      // The new width should be twice this projection (to extend from center)
      newWidths[i] = Math.abs(projectionLength) * 2;

      // Add a small margin to ensure walls overlap
      const overlapMargin = 0.01; // Small overlap to prevent gaps
      newWidths[i] += overlapMargin;
    }

    // Now update all walls with their new widths
    for (let i = 0; i < totalWalls; i++) {
      walls[i].width = newWidths[i];
    }
  }
}
