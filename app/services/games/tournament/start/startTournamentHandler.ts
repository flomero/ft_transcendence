import { FastifyReply, FastifyRequest } from "fastify";
import { tournaments } from "../new/newTournamentHandler";

async function startTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const userid = request.userId;
  const tournaemtId = request.params.lobbyId;
  const tournamentManager = tournaments.get(tournaemtId);

  if (!tournamentManager) {
    return reply.badRequest("Tournament not found");
  }
}

export default startTournamentHandler;
