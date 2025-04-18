import { gameManagers } from "../lobby/start/startLobbyHandler";
import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import gameValidationCheck from "./gameValidationCheck";
import handleGameMessage from "./handleGameMessage";

const gameWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest<{ Params: { gameId: string } }>,
): Promise<void> => {
  const gameId = request.params.gameId;
  const userId = request.userId;
  const gameManager = gameManagers.get(gameId);

  try {
    gameValidationCheck(userId, gameId);
    gameManager!.addSocketToPlayer(userId, connection);

    if (gameManager!.allPlayersAreConnected() === true) {
      await gameManager!.startGame(request.server.sqlite);
    }

    connection.on("message", (message: string) => {
      handleGameMessage(message, userId, gameId);
    });
  } catch (error) {
    if (error instanceof Error) {
      connection.send(
        JSON.stringify({ type: "error", data: { message: error.message } }),
      );
    }
  }
};

export default gameWebsocketHandler;
