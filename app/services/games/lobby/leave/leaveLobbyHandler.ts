import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { LobbyRequestWithLobbyId } from "../../../../interfaces/games/lobby/LobbyRequestWithMatchId";
import { removeUserFromLobby } from "./removeUserFromLobby";
import closePossibleLobbySocketConnection from "./closePossibleLobbySocketConnection";

async function leaveLobbyHandler(
  request: FastifyRequest <{ Body: LobbyRequestWithLobbyId }>,
  reply: FastifyReply ): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.body.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId)
    closePossibleLobbySocketConnection(userId, lobbyId);
    removeUserFromLobby(userId, lobbyId);
  }
  catch (error) {
    if (error instanceof Error)
      reply.code(400).send({ error: error.message });
    return;
  }
}

export default leaveLobbyHandler;
