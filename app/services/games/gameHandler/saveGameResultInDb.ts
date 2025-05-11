import type { Database } from "sqlite";
import type GameManager from "./GameManager";
/**
 * Main function to save game results to the database
 */
const saveGameResultInDb = async (gameManager: GameManager, db: Database) => {
  await savePlayerScoresAndResultToDatabase(gameManager, db);
  await saveAIScoresAndResultToDatabase(gameManager, db);
  await updateMatchStatusToFinished(gameManager, db);
};

/**
 * Saves player scores to the database
 * @private Not exported - internal helper function
 */
const savePlayerScoresAndResultToDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const gameScores = gameManager.getScores();
  const players = gameManager.getPlayersAsArray();
  const gameResults = gameManager.getResults();
  const query = `UPDATE r_users_matches SET score = ?, result = ? WHERE userId = ? AND matchId = ?`;

  for (const player of players) {
    const score = gameScores[player.id];
    const result = gameResults[player.id];

    try {
      await db.run(query, [
        score,
        result,
        player.playerUUID,
        gameManager.getId(),
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
  const gameScores = gameManager.getScores();
  const gameResults = gameManager.getResults();
  const referenceTable = gameManager.getReferenceTable();
  const query = `UPDATE r_users_matches SET score = ?, result = ? WHERE userId = ? AND matchId = ?`;

  if (!gameManager.aiOpponents || gameManager.aiOpponents.size === 0) return;

  for (const aiOpponent of gameManager.aiOpponents.values()) {
    const playerInGameId = aiOpponent.getId();
    const playerUUID = referenceTable[playerInGameId];
    const score = gameScores[playerInGameId];
    const result = gameResults[playerInGameId];

    try {
      await db.run(query, [score, result, playerUUID, gameManager.getId()]);
    } catch (err) {
      if (err instanceof Error)
        console.error(
          `Error updating AI score for ${playerUUID}:`,
          err.message,
        );
    }
  }
};

const updateMatchStatusToFinished = async (
  gameManager: GameManager,
  db: Database,
) => {
  const query = `UPDATE matches SET result = 'finished' WHERE id = ?`;
  try {
    await db.run(query, [gameManager.getId()]);
  } catch (err) {
    if (err instanceof Error) {
      console.error("Error updating match status:", err.message);
    }
  }
};

export default saveGameResultInDb;
