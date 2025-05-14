import type { FastifyRequest, FastifyReply } from "fastify";
import { tournaments } from "../tournaments";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";

async function leaveTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentId = request.params.lobbyId;

    validTournamentConnectionCheck(userId, tournamentId);
    const tournamentManager = tournaments.get(tournamentId);
    tournamentManager?.leaveTournament(userId);
    return reply.redirect("/play");
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.internalServerError();
  }
}

export default leaveTournamentHandler;
