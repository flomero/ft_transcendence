import GameManager from "../gameHandler/GameManager";
import { GameStatus } from "../../../types/games/gameBaseState";
import type { Database } from "sqlite";

const connectionTimeoutHandler = (gameManager: GameManager, db: Database) => {
  setTimeout(() => startAiGame(gameManager, db), 2000);
  setTimeout(() => startGameIfNotAllPlayerConnected(gameManager, db), 15000);
  setTimeout(
    () => disqualifyNotConnectedPlayersIfOnePlayer(gameManager),
    50000,
  );
};

const startAiGame = (gameManager: GameManager, db: Database) => {
  if (gameManager.justAisInGame() === true) {
    gameManager.startGame(db);
  }
};

const startGameIfNotAllPlayerConnected = (
  gameManager: GameManager,
  db: Database,
) => {
  if (gameManager.allPlayersAreConnected() === true) return;

  if (gameManager.gameStatus() === GameStatus.CREATED) {
    gameManager.startGame(db);
  }
};

const disqualifyNotConnectedPlayersIfOnePlayer = (gameManager: GameManager) => {
  if (gameManager.connectedNumberOfPlayersInGame() === 1)
    gameManager.disqualifyNotConnectedPlayers();
};

export default connectionTimeoutHandler;
