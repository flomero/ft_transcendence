import type { FastifyRequest } from "fastify";
import type { WebSocket } from "ws";
import { matchMakingManager } from "./MatchMakingManager";
import matchPlayers from "./matchPlayers";

const matchMakingSocketHandler = async (
  connection: WebSocket,
  request: FastifyRequest,
): Promise<void> => {
  const userId = request.userId;

  try {
    if (matchMakingManager.memberExists(userId) === false)
      throw new Error("User is not in the match making queue");
    matchMakingManager.setMemberSocket(userId, connection);
    await matchPlayers(request.server);
  } catch (error) {
    if (error instanceof Error)
      connection.send(JSON.stringify({ error: error.message }));
    connection.close();
    return;
  }

  connection.on("close", () => {
    if (matchMakingManager.memberExists(userId) === true)
      matchMakingManager.removeMemberSocket(userId);
  });
};

export default matchMakingSocketHandler;
