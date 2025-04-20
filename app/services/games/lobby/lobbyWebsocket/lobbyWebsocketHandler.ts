import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { getLobby } from "./getLobby";
import closePossibleLobbySocketConnection from "../leave/closePossibleLobbySocketConnection";

const lobbyWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
): Promise<void> => {
  const lobbyId = request.params.lobbyId;
  const userId = request.userId;

  try {
    validConnectionCheck(userId, lobbyId);
    const lobby = getLobby(lobbyId);
    lobby.addSocketToMember(userId, connection);

    connection.on("close", () => {
      try {
        closePossibleLobbySocketConnection(userId, lobbyId);
      } catch (_) {}
    });
  } catch (error) {
    if (error instanceof Error)
      connection.send(JSON.stringify({ error: error.message }));
    connection.close();
    return;
  }
};

export default lobbyWebsocketHandler;
