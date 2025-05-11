import type { FastifyRequest, FastifyReply } from "fastify";
import gameValidationCheck from "../gameValidationCheck";
import { getGameOfPlayer } from "../../gameHandler/getGameOfPlayer";

async function leaveGameHandler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;

  try {
    const gameManager = getGameOfPlayer(userId);
    if (!gameManager) {
      return reply.notFound("Game not found");
    }

    gameValidationCheck(userId, gameManager.getId());

    gameManager.leaveGame(userId);
    return reply.redirect("/play");
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default leaveGameHandler;
