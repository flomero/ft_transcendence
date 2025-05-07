import type { Database } from "sqlite";
import type GameManager from "./GameManager";

/**
 * Main function to save game results to the database
 */
const saveGameResultInDb = async (gameManager: GameManager, db: Database) => {
  await savePlayerScoresToDatabase(gameManager, db);
  await saveAIScoresToDatabase(gameManager, db);
  await saveGameResultInRUserMatches(gameManager, db);
};

/**
 * Saves player scores to the database
 * @private Not exported - internal helper function
 */
const savePlayerScoresToDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const gameScores = gameManager.getScores;
  const players = gameManager.getPlayersAsArray;
  const query = `UPDATE r_users_matches SET score = ? WHERE userId = ? AND matchId = ?`;

  for (const player of players) {
    const score = gameScores[player.id];

    try {
      await db.run(query, [score, player.playerUUID, gameManager.getId]);
    } catch (err) {
      if (err instanceof Error)
        console.error("Error updating player score:", err.message);
    }
  }
};

/**
 * Saves AI opponent scores to the database
 * @private Not exported - internal helper function
 */
const saveAIScoresToDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const gameScores = gameManager.getScores;
  const gameResults = gameManager.getResults;
  const query = `UPDATE r_users_matches SET score = ?, result = ? WHERE userId = ? AND matchId = ?`;

  if (!gameManager.aiOpponent || gameManager.aiOpponent.size === 0) return;

  for (const aiOpponent of gameManager.aiOpponent.values()) {
    const playerId = aiOpponent.getId();
    const score = gameScores[playerId];
    const result = gameResults[playerId];

    try {
      await db.run(query, [score, result, playerId, gameManager.getId]);
    } catch (err) {
      if (err instanceof Error)
        console.error(`Error updating AI score for ${playerId}:`, err.message);
    }
  }
};

const saveGameResultInRUserMatches = async (
  gameManager: GameManager,
  db: Database,
): Promise<void> => {
  const orderedRsultWithUUIDs = gameManager.getOrderedResultsWithUUIDs();
  const gameId = gameManager.getId;
  const sql = `UPDATE r_users_matches SET result = ? WHERE userId = ? AND matchId = ?`;
  console.log("Game results:", inGameResults);
  for (const player of gameManager.getPlayersAsArray) {
    const playerId = player.playerUUID;
    console.log("Player ID:", playerId, "Score:", score);
  }
  const query = db.prepare(sql, [orderedRsultWithUUIDs, gameId]);
};

export default saveGameResultInDb;
