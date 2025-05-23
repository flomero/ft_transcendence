import { gameManagers } from "../lobby/start/startLobbyHandler";
import type { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import gameValidationCheck from "./gameValidationCheck";
import handleGameMessage from "./handleGameMessage";
import sendTheInitialGameStateToEveryone from "./sendTheInitialGameStateToEveryone";
import { gameDisconnectionHandler } from "./connectionTimeoutHandler";

const gameWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest<{ Params: { gameId: string } }>,
): Promise<void> => {
  const gameId = request.params.gameId;
  const userId = request.userId;
  const gameManager = gameManagers.get(gameId);

  try {
    gameValidationCheck(userId, gameId);
    gameManager?.addSocketToPlayer(userId, connection);
    gameManager?.shuffleReferenceTable();
    sendTheInitialGameStateToEveryone(gameManager!);

    if (gameManager!.allPlayersAreConnected() === true) {
      await gameManager?.startGame(request.server);
    }

    connection.on("message", (message: string) => {
      handleGameMessage(message, userId, gameId);
    });
    connection.on("close", () => {
      if (gameManager) gameDisconnectionHandler(userId, gameManager);
      gameManager?.removePlayerSocket(userId);
    });
    connection.on("error", () => {
      if (gameManager) gameDisconnectionHandler(userId, gameManager);
      gameManager?.removePlayerSocket(userId);
    });
  } catch (error) {
    if (error instanceof Error) {
      connection.send(
        JSON.stringify({ type: "error", data: { message: error.message } }),
      );
      if (connection.readyState === WebSocket.OPEN) {
        connection.close(1008, error.message);
      }
    }
  }
};

export default gameWebsocketHandler;
