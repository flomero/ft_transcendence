import { FastifyRequest } from "fastify";
import { WebSocket } from "ws";
import { matchMakingManager } from "./join/joinMatchMakingHandler";

const lobbyWebsocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest,
): Promise<void> => {
  const userId = request.userId;

  try {
    if (matchMakingManager.memberExists(userId) === false) {
      throw new Error("User is not in the match making queue");
    }

    connection.on("close", () => {
      matchMakingManager.removeMemberSocket(userId);
    });
  } catch (error) {
    if (error instanceof Error)
      connection.send(JSON.stringify({ error: error.message }));
    connection.close();
    return;
  }
};

export default lobbyWebsocketHandler;
