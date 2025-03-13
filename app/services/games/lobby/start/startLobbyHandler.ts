import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import setLobbyStateToStart from "./setLobbyStateToStart";
import areAllMembersReady from "../lobbyVaidation/areAllMembersReady";

async function startLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const lobbyId = request.params.lobbyId;
  const userId = request.userId;

  try {
    validConnectionCheck(userId, lobbyId);
    areAllMembersReady(lobbyId);
    setLobbyStateToStart(lobbyId, userId);
    reply.code(200).send({ message: "Lobby started" });
  } catch (error) {
    if (error instanceof Error)
      reply.code(400).send({ message: error.message });
  }
}

export default startLobbyHandler;
