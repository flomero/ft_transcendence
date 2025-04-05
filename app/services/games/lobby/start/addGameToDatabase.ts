import GameManager from "../../gameHandler/GameManager";
import { Database } from "sqlite";
import { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";
import { randomUUID } from "crypto";

const addGameToDatabase = async (
  gameManager: GameManager,
  db: Database,
  gameSettings: GameSettings,
) => {
  addMatchToDatabase(gameManager, db, gameSettings);
  addUserMatchesToDB(gameManager, db);
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
    db.run(sql, randomUUID(), userId, gameManager.getId, 0);
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

  db.run(
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
