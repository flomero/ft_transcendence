import type { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { setReadyState } from "./setReadyState";

async function readyLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string; state: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;
  const state = request.params.state.toLowerCase() === "true";
  try {
    validConnectionCheck(userId, lobbyId);
    setReadyState(lobbyId, userId, state);
    return reply.code(200).send({ message: "User is ready" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.badRequest("Error setting ready state");
  }
}
export default readyLobbyHandler;
