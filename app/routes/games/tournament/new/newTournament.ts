import type { FastifyPluginAsync } from "fastify";
import newTournamentSchema from "../../../../schemas/games/tournament/newTournamentSchema";
import newTournamentHandler from "../../../../services/games/tournament/new/newTournamentHandler";

const newTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:tournamentConfigName/:gameModeName/:tournamentSize", {
    schema: newTournamentSchema,
    handler: newTournamentHandler,
  });
};

export default newTournament;
