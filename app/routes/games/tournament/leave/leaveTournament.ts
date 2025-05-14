import type { FastifyPluginAsync } from "fastify";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";
import leaveTournamentHandler from "../../../../services/games/tournament/leave/leaveTournamentHandler";

const leaveTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: leaveTournamentHandler,
    schema: joinLobbySchema,
  });
};

export default leaveTournament;
