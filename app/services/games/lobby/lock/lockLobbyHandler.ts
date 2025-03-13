import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import canLobbyBeClosedLocked from "../lobbyVaidation/canLobbyBeLocked";
import { changeLockState } from "./changelockState";

async function lockLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string; state: boolean } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;
  const state = request.params.state;

  try {
    validConnectionCheck(userId, lobbyId);
    canLobbyBeClosedLocked(lobbyId);
    changeLockState(lobbyId, userId, state);
    reply.code(200).send({ message: "Lobby is locked: " + state });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
    return;
  }
}

export default lockLobbyHandler;
