import { PongModifierBase } from "../pongModifierBase";
import { Pong } from "../pong";
import { Rectangle } from "../../../../types/games/pong/rectangle";

export class ArenaShrink extends PongModifierBase {
  name = "arenaShrink";

  shrunkIds: number[] = [];

  constructor() {
    super();
  }

  onPlayerElimination(game: Pong, args: { playerId: number }): void {
    const extraGameData = game.getExtraGameData();

    // Get the goal_wall & 2 surrounding walls
    const wallIds: number[] = [1, 0, -1].map(
      (off) =>
        (2 * args.playerId + off + 2 * extraGameData.playerCount) %
        (2 * extraGameData.playerCount),
    );

    this.shrunkIds.push(wallIds[1]);

    const walls = wallIds.map((id) => game.getGameObjects().walls[id]);

    const leftmost = {
      x: walls[0]["absX"] + game.getArenaSettings().radius,
      y: walls[0]["absY"] + game.getArenaSettings().radius,
      absX: walls[0]["absX"],
      absY: walls[0]["absY"],
    };

    const rightmost = {
      x: walls[2]["absX"] + game.getArenaSettings().radius,
      y: walls[2]["absY"] + game.getArenaSettings().radius,
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

    game.getGameObjects().walls[wallIds[0]].width /= 1.05;
    game.getGameObjects().walls[wallIds[1]] = shrunkWall;
    game.getGameObjects().walls[wallIds[2]].width /= 1.05;

    // If a non-goal wall is surrounded by 2 players that got eliminated, hide it.
    // Check whether adjacent players are eliminated
    const adjacentPlayerStatus = [-1, 1].filter((offset) => {
      const index =
        (args.playerId + offset + extraGameData.playerCount) %
        extraGameData.playerCount;
      return extraGameData.results[index] !== 0;
    });

    // Hide the corresponding wall
    for (const adjacent of adjacentPlayerStatus) {
      const adjacentWallId =
        (2 * args.playerId + adjacent + 2 * extraGameData.playerCount) %
        (2 * extraGameData.playerCount);
      game.getGameObjects().walls[adjacentWallId].isVisible = false;
    }

    // for wall_id in adjacent_players_status:
    // 		if wall_id:
    // 				game.walls[(2 * player_id + wall_id) % (2 * game.player_count)]["visible"] = False
    // 				extra_id = player_id if wall_id > 0 else (player_id + game.player_count + wall_id) % game.player_count
    // 				game.walls[2 * game.player_count + extra_id]["visible"] = False
  }
}
