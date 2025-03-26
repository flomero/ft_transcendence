import { FastifyRequest, FastifyReply } from "fastify";
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
    reply.code(200).send({ message: "User is ready" });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
    return;
  }
}
export default readyLobbyHandler;
