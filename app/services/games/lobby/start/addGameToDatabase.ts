import type GameManager from "../../gameHandler/GameManager";
import type { Database } from "sqlite";
import type { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";
import { randomUUID } from "node:crypto";

const addGameToDatabase = async (
  gameManager: GameManager,
  db: Database,
  gameSettings: GameSettings,
) => {
  await addMatchToDatabase(gameManager, db, gameSettings);
  await addUserMatchesToDB(gameManager, db);
};

const addUserMatchesToDB = async (gameManager: GameManager, db: Database) => {
  const sql = `
  INSERT INTO r_users_matches (
    id,
    userId,
    matchId,
    score)
  VALUES (?, ?, ?, ?)
  `;
  for (const userId of gameManager.players.keys()) {
    await db.run(sql, randomUUID(), userId, gameManager.getId, 0);
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

  await db.run(
    sql,
    gameManager.getId,
    gameSettings.gameName,
    gameSettings.gameModeName,
    JSON.stringify(gameSettings.modifierNames),
    gameSettings.playerCount,
    JSON.stringify(gameSettings.gameModeConfig),
    JSON.stringify(gameSettings.powerUpNames),
  );
};
export default addGameToDatabase;
