import type { FastifyRequest, FastifyReply } from "fastify";
import canMemberJoinTournamentCheck from "./canMemberJoinTournamentCheck";
import { tournaments } from "../tournaments";

async function joinTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const memberId = request.userId;
    const tournamentId = request.params.lobbyId;

    canMemberJoinTournamentCheck(memberId, tournamentId);
    tournaments.get(tournamentId)?.addMember(memberId);

    const data = {
      title: "Tournament Lobby | ft_transcendence",
      id: tournamentId,
    };
    reply.header("X-Page-Title", "Tournament Lobby | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournament/lobby", data, viewOptions);
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.internalServerError();
  }
}

export default joinTournamentHandler;
