import type { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { getLobby } from "../lobbyWebsocket/getLobby";

async function addAIOpponentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId);
    const lobby = getLobby(lobbyId);
    lobby.addAiOpponent(userId);
    return reply.send({ message: "AI Opponent has been added" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default addAIOpponentHandler;
