import type { Database } from "sqlite";
import type GameManager from "./GameManager";

/**
 * Main function to save game results to the database
 */
const saveGameResultInDb = async (gameManager: GameManager, db: Database) => {
  await savePlayerScoresAndResultToDatabase(gameManager, db);
  await saveAIScoresAndResultToDatabase(gameManager, db);
};

/**
 * Saves player scores to the database
 * @private Not exported - internal helper function
 */
const savePlayerScoresAndResultToDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const gameScores = gameManager.getScores;
  const players = gameManager.getPlayersAsArray;
  const gameResults = gameManager.getResults;
  const query = `UPDATE r_users_matches SET score = ?, result = ? WHERE userId = ? AND matchId = ?`;

  for (const player of players) {
    const score = gameScores[player.id];
    const result = gameResults[player.id];

    try {
      await db.run(query, [
        score,
        result,
        player.playerUUID,
        gameManager.getId,
      ]);
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
const saveAIScoresAndResultToDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const gameScores = gameManager.getScores;
  const gameResults = gameManager.getResults;
  const query = `UPDATE r_users_matches SET score = ?, result = ? WHERE userId = ? AND matchId = ?`;

  if (!gameManager.aiOpponents || gameManager.aiOpponents.size === 0) return;

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

export default saveGameResultInDb;
