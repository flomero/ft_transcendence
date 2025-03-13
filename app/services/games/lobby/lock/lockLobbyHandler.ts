import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import canLobbyBeClosedLocked from "../lobbyVaidation/canLobbyBeLocked";
import lockLobby from "./lockLobby";

async function lockLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId);
    canLobbyBeClosedLocked(lobbyId);
    lockLobby(lobbyId, userId);
    reply.code(200).send({ message: "Lobby is locked" });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
    return;
  }
}

export default lockLobbyHandler;
