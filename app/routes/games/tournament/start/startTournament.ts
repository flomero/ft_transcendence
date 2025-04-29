import type { FastifyPluginAsync } from "fastify";
import startTournamentHandler from "../../../../services/games/tournament/start/startTournamentHandler";
import startTournamentSchema from "../../../../schemas/games/lobby/startLobbySchema";

const startTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: startTournamentHandler,
    schema: startTournamentSchema,
  });
};

export default startTournament;
