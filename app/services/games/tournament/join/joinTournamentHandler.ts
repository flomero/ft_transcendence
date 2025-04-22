import { FastifyRequest, FastifyReply } from "fastify";
import canMemberJoinTournamentCheck from "./canMemberJoinTournamentCheck";
import { tournaments } from "../new/newTournamentHandler";

async function joinTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const memberId = request.userId;
    const tournamentId = request.params.lobbyId;

    canMemberJoinTournamentCheck(memberId, tournamentId);
    tournaments.get(tournamentId)?.addMember(memberId);

    return reply.code(200).send({ tournamentId: tournamentId });
  } catch (error) {
    if (error instanceof Error) {
      return reply.code(400).send({ message: error.message });
    }
    return reply.code(500).send({ message: "Internal server error" });
  }
}

export default joinTournamentHandler;
