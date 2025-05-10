import type { FastifyPluginAsync } from "fastify";
import leaveTournamentHandler from "../../../../services/games/tournament/leave/leaveTournamentHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const leaveTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: leaveTournamentHandler,
    schema: joinLobbySchema,
  });
};

export default leaveTournament;
