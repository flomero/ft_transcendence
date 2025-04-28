import type { FastifyPluginAsync } from "fastify";
import joinTournamentHandler from "../../../../services/games/tournament/join/joinTournamentHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const joinTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: joinTournamentHandler,
    schema: joinLobbySchema,
  });
};

export default joinTournament;
