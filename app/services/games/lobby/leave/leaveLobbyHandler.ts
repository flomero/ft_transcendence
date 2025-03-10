import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { removeUserFromLobby } from "./removeUserFromLobby";
import closePossibleLobbySocketConnection from "./closePossibleLobbySocketConnection";

async function leaveLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId);
    closePossibleLobbySocketConnection(userId, lobbyId);
    removeUserFromLobby(userId, lobbyId);
    reply.send({ message: "You have left the lobby" });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
    return;
  }
}

export default leaveLobbyHandler;
