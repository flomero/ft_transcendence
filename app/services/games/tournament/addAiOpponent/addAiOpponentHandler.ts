import type { FastifyRequest, FastifyReply } from "fastify";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";
import { tournaments } from "../new/newTournamentHandler";

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
    return reply.send({ message: "AI Opponent has been added" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default addAIOpponentHandler;
