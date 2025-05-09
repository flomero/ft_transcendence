import GameManager from "../gameHandler/GameManager";
import { GameStatus } from "../../../types/games/gameBaseState";
import { FastifyInstance } from "fastify";

const connectionTimeoutHandler = (
  gameManager: GameManager,
  fastiy: FastifyInstance,
) => {
  setTimeout(() => startAiGame(gameManager, fastiy), 2000);
  setTimeout(
    () => startGameIfNotAllPlayerConnected(gameManager, fastiy),
    15000,
  );
  setTimeout(
    () => disqualifyNotConnectedPlayersIfOnePlayer(gameManager),
    50000,
  );
};

const startAiGame = (gameManager: GameManager, fastiy: FastifyInstance) => {
  if (gameManager.justAisInGame() === true) {
    gameManager.startGame(fastiy);
  }
};

const startGameIfNotAllPlayerConnected = (
  gameManager: GameManager,
  fastiy: FastifyInstance,
) => {
  if (gameManager.allPlayersAreConnected() === true) return;

  if (gameManager.gameStatus() === GameStatus.CREATED) {
    gameManager.startGame(fastiy);
  }
};

const disqualifyNotConnectedPlayersIfOnePlayer = (gameManager: GameManager) => {
  if (gameManager.connectedNumberOfPlayersInGame() === 1)
    gameManager.disqualifyNotConnectedPlayers();
};

export default connectionTimeoutHandler;
