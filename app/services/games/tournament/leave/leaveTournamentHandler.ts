import { FastifyRequest, FastifyReply } from "fastify";
import canTournamentBeLeftCheck from "../../lobby/leave/canTournamentBeLeftCheck";
import { tournaments } from "../new/newTournamentHandler";

async function leaveTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const userId = request.userId;
    const tournamentId = request.params.lobbyId;

    canTournamentBeLeftCheck(userId, tournamentId);
    const tournamentManager = tournaments.get(tournamentId);
    tournamentManager?.removeMemberSave(userId);
    // handle more cases here once tournament is running
    return reply.code(201).send({ tournamentId: tournamentId });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ error: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default leaveTournamentHandler;
