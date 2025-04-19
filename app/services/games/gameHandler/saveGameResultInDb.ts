import type { Database } from "sqlite";
import type GameManager from "./GameManager";

/**
 * Main function to save game results to the database
 */
const saveGameResultInDb = async (gameManager: GameManager, db: Database) => {
  await savePlayerScoresToDatabase(gameManager, db);
  await saveAIScoresToDatabase(gameManager, db);
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
    console.log(`Saving score for player ${player.playerUUID}: ${score}`);

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
  const query = `UPDATE r_users_matches SET score = ? WHERE userId = ? AND matchId = ?`;

  if (!gameManager.aiOpponent || gameManager.aiOpponent.size === 0) return;

  for (const [aiUuid, aiOpponent] of gameManager.aiOpponent.entries()) {
    const playerId = aiOpponent.getId();
    const score = gameScores[playerId];

    console.log(`Saving score for AI ${aiUuid}: ${score}`);

    try {
      await db.run(query, [score, aiUuid, gameManager.getId]);
    } catch (err) {
      if (err instanceof Error)
        console.error(`Error updating AI score for ${aiUuid}:`, err.message);
    }
  }
};

export default saveGameResultInDb;
