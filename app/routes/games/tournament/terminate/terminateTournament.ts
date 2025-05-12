import type { FastifyPluginAsync } from "fastify";
import terminateTournamentHandler from "../../../../services/games/tournament/terminate/terminateTournamentHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const terminateTournament: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: terminateTournamentHandler,
    schema: joinLobbySchema,
  });
};

export default terminateTournament;
