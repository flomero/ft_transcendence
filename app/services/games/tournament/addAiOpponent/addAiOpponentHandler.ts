import type { FastifyRequest, FastifyReply } from "fastify";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";
import { tournaments } from "../tournaments";

async function addAIOpponentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>, // eg tournamentId
  reply: FastifyReply,
): Promise<void> {
  try {
    const memberId = request.userId;
    const tournamentId = request.params.lobbyId;
    validTournamentConnectionCheck(memberId, tournamentId);
    const tournament = tournaments.get(tournamentId);

    tournament?.addAiOpponent(memberId);
    return reply.code(200).send({ message: "AI Opponent has been added" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default addAIOpponentHandler;
