import GameManager from "../gameHandler/GameManager";
import { GameStatus } from "../../../types/games/gameBaseState";
import { FastifyInstance } from "fastify";

export const connectionTimeoutHandler = (
  gameManager: GameManager,
  fastify: FastifyInstance,
) => {
  setTimeout(() => startAiGame(gameManager, fastify), 2000);
  setTimeout(
    () => startGameIfNotAllPlayerConnected(gameManager, fastify),
    15000,
  );
  setTimeout(
    () => disqualifyNotConnectedPlayersIfOnePlayer(gameManager),
    50000,
  );
};

const startAiGame = (gameManager: GameManager, fastiy: FastifyInstance) => {
  try {
    if (gameManager.justAisInGame() === true) {
      gameManager.startGame(fastiy);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("[connectionTimeoutHandler] Error starting AI game:", err);
    }
  }
};

const startGameIfNotAllPlayerConnected = (
  gameManager: GameManager,
  fastiy: FastifyInstance,
) => {
  if (gameManager.allPlayersAreConnected() === true) return;

  try {
    if (gameManager.gameStatus() === GameStatus.CREATED) {
      gameManager.startGame(fastiy);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(
        "[connectionTimeoutHandler] Error starting game with not all players connected:",
        err,
      );
    }
  }
};

const disqualifyNotConnectedPlayersIfOnePlayer = (gameManager: GameManager) => {
  if (gameManager.connectedNumberOfPlayersInGame() === 1)
    gameManager.disqualifyNotConnectedPlayers();
};

export const gameDisconnectionHandler = async (
  userId: string,
  gameManager: GameManager,
) => {
  setTimeout(() => {
    try {
      if (
        gameManager.isUserConnected(userId) === false &&
        gameManager.gameStatus() === GameStatus.RUNNING
      ) {
        gameManager.disqualifyPlayer(userId);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(
          "[gameDisconnectionHandler] Error handling game disconnection:",
          err,
        );
      }
    }
  }, 30000);
};
