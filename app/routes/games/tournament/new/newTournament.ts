import type { FastifyPluginAsync } from "fastify";
import newTournamentSchema from "../../../../schemas/games/tournament/newTournamentSchema";
import newTournamentHandler from "../../../../services/games/tournament/new/newTournamentHandler";

const newTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    schema: newTournamentSchema,
    handler: newTournamentHandler,
  });
};

export default newTournament;
