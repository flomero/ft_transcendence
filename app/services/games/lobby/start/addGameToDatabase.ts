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
  addPlayersToMatchOnDatabase(gameManager, db);
};

const addPlayersToMatchOnDatabase = async (
  gameManager: GameManager,
  db: Database,
) => {
  const sql = `
  INSERT INTO players (id, userId, userId, matchId, score)
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
  INSERT INTO games (id, game, gameMode, modifiers, customizableSettings)
  VALUES (?, ?, ?, ?)
  `;
  db.run(
    sql,
    gameManager.getId,
    gameSettings.gameName,
    gameSettings.gameMode,
    gameSettings.gameModifiers,
    gameSettings.customizableSettings,
  );
};
export default addGameToDatabase;
