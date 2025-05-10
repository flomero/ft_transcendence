import type { FastifyPluginAsync } from "fastify";
import { getCurrentTournamentInfo } from "../../services/games/tournament/tournamentVisualizer";
import { tournaments } from "../../services/games/tournament/tournaments";

interface BracketQuery {
  auto?: string; // ?auto=false      ➜ manual edges
  partial?: string; // (left intact – not used here)
}

const tournamentsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: BracketQuery }>("/", async (request, reply) => {
    const infos = [];
    for (let tournament of tournaments.values()) {
      const info = await getCurrentTournamentInfo(request.server, tournament);
      infos.push(info);
    }

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view(
      "views/tournaments",
      { tournaments: infos, debug: JSON.stringify(infos) },
      viewOptions,
    );
  });
};

export default tournamentsRoute;
