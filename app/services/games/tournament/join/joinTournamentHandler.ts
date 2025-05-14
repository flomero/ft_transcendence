import type { FastifyRequest, FastifyReply } from "fastify";
import canMemberJoinTournamentCheck from "./canMemberJoinTournamentCheck";
import { tournaments } from "../tournaments";
import { getUserById } from "../../../database/user";
import { getCurrentTournamentInfo } from "../tournamentVisualizer";

async function joinTournamentHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  try {
    const memberId = request.userId;
    const tournamentId = request.params.lobbyId;
    const tournament = tournaments.get(tournamentId);
    if (!tournament) return reply.redirect("/play");

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

    const info = await getCurrentTournamentInfo(request.server, tournament);

    const data = {
      title: "Tournament Lobby | ft_transcendence",
      id: tournamentId,
      tournament: tournament,
      members: members,
      isOwner: tournament.ownerId === request.userId,
      canStart: tournament.canTournamentBeStarted(),
      info: info,
      lobbyString: JSON.stringify(info),
      canLeave: tournament.canTournamentBeLeaved(memberId),
    };
    reply.header("X-Page-Title", "Tournament Lobby | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournament/lobby", data, viewOptions);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Tournament started already"
    ) {
      return reply.redirect("/play");
    }
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.internalServerError();
  }
}

export default joinTournamentHandler;
