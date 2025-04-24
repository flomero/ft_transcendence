import GameManager from "../gameHandler/GameManager";
import { GameStatus } from "../gameBase";
import type { Database } from "sqlite";

const connectionTimeoutHandler = (gameManager: GameManager, db: Database) => {
  setTimeout(() => disconnectMembersIfNotConnected(gameManager, db), 25000);
};

const disconnectMembersIfNotConnected = (
  gameManager: GameManager,
  db: Database,
) => {
  if (gameManager.allPlayersAreConnected() === true) return;

  if (gameManager.gameStatus === GameStatus.CREATED) {
    gameManager.startGame(db);
  }
};

export default connectionTimeoutHandler;
