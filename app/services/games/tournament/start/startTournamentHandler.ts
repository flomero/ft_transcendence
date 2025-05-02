import { FastifyReply, FastifyRequest } from "fastify";
import { tournaments } from "../new/newTournamentHandler";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";

async function startTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const memberId = request.userId;
  const tournaemtId = request.params.lobbyId;
  const tournamentManager = tournaments.get(tournaemtId);

  try {
    validTournamentConnectionCheck(memberId, tournaemtId);
    await tournamentManager?.startTournament(request.server.sqlite); //go to be awaited
    return reply.code(200).send({ message: "Tournament started" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default startTournamentHandler;
