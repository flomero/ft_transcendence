import type GameManager from "../../gameHandler/GameManager";
import type { Database } from "sqlite";
import type { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";

const addGameToDatabase = async (
  gameManager: GameManager,
  db: Database,
  gameSettings: GameSettings,
) => {
  try {
    await addMatchToDatabase(gameManager, db, gameSettings);
    await addUserMatchesToDB(gameManager, db);
    await addAIToDatabase(gameManager, db);
  } catch (error) {
    console.error("[addGameToDatabase] Error adding game to DB:", error);
  }
};

const addUserMatchesToDB = async (gameManager: GameManager, db: Database) => {
  const sql = `
  INSERT INTO r_users_matches (
    userId,
    matchId,
    score)
  VALUES (?, ?, ?)
  `;
  for (const userId of gameManager.players.keys()) {
    await db.run(sql, [userId, gameManager.getId(), 0]);
  }
};

const addMatchToDatabase = async (
  gameManager: GameManager,
  db: Database,
  gameSettings: GameSettings,
) => {
  const sql = `
  INSERT INTO matches (
  id,
  gameName,
  gameModeName,
  modifierNames,
  playerCount,
  gameModeConfig,
  powerUpNames)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  await db.run(sql, [
    gameManager.getId(),
    gameSettings.gameName,
    gameSettings.gameModeName,
    JSON.stringify(gameSettings.modifierNames),
    gameSettings.playerCount,
    JSON.stringify(gameSettings.gameModeConfig),
    JSON.stringify(gameSettings.powerUpNames),
  ]);
};

const addAIToDatabase = async (gameManager: GameManager, db: Database) => {
  if (gameManager.getAiIdsAsArray().length === 0) return;
  const sql = `
  INSERT INTO r_users_matches (
    userId,
    matchId,
    score)
    VALUES (?, ?, ?)
  `;
  const aiIds = gameManager.getAiIdsAsArray();

  for (const aiId of aiIds) {
    await db.run(sql, [aiId, gameManager.getId(), 0]);
  }
};

export default addGameToDatabase;
