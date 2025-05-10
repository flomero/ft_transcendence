import type { FastifyReply, FastifyRequest } from "fastify";
import { tournaments } from "../tournaments";
import validTournamentConnectionCheck from "../tournamentValidation/validTournamentConnectionCheck";
import { TournamentStatus } from "../tournament";

async function startTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const memberId = request.userId;
  const tournaemtId = request.params.lobbyId;
  const tournamentManager = tournaments.get(tournaemtId);
  const tournamentStatus = tournamentManager?.getTournamentStatus();

  try {
    validTournamentConnectionCheck(memberId, tournaemtId);
    if (tournamentManager?.ownerId !== memberId)
      throw new Error("You are not the owner of this tournament");
    if (
      tournamentStatus !== undefined &&
      tournamentStatus !== TournamentStatus.CREATED
    ) {
      throw new Error("Tournament already started");
    }

    await tournamentManager?.startTournament(request.server.sqlite); //go to be awaited
    return reply.code(200).send({ message: "Tournament started" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default startTournamentHandler;
