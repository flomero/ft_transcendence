import type { FastifyRequest, FastifyReply } from "fastify";
import canMemberJoinTournamentCheck from "./canMemberJoinTournamentCheck";
import { tournaments } from "../tournaments";
import { getUserById } from "../../../database/user";

async function joinTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const memberId = request.userId;
    const tournamentId = request.params.lobbyId;
    const tournament = tournaments.get(tournamentId);
    if (!tournament) return reply.notFound("Tournament not found");

    canMemberJoinTournamentCheck(memberId, tournamentId);
    tournament.addMember(memberId);

    const uuids = tournament.getPlayersUUIDs();
    const members = await Promise.all(
      uuids.map(async (uuid) => {
        const user = await getUserById(request.server, uuid);
        if (!user) return null;
        return {
          userId: user.id,
          userName: user.username,
          image_id: user.image_id,
          isOwner: tournament.ownerId === user.id,
        };
      }),
    );

    const data = {
      title: "Tournament Lobby | ft_transcendence",
      id: tournamentId,
      tournament: tournament,
      members: members,
      isOwner: tournament.ownerId === request.userId,
      canStart: tournament.canTournamentBeStarted(),
      // lobbyString: JSON.stringify(members),
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
