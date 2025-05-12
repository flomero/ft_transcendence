import type { FastifyRequest, FastifyReply } from "fastify";
import canTournamentBeLeftCheck from "../../lobby/leave/canTournamentBeLeftCheck";
import { tournaments } from "../tournaments";

async function terminateTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentId = request.params.lobbyId;

    canTournamentBeLeftCheck(userId, tournamentId);
    const tournamentManager = tournaments.get(tournamentId);
    tournamentManager?.removeMemberSave(userId);
    return reply.code(201).send({ tournamentId: tournamentId });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.internalServerError();
  }
}

export default terminateTournamentHandler;
