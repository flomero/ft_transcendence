import type { FastifyPluginAsync } from "fastify";
import createTournamentHandler from "../../../../services/games/tournament/create/createTournamentHandler";
import createTournamentSchema from "../../../../schemas/games/tournament/createTournamentSchema";

const createTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    schema: createTournamentSchema,
    handler: createTournamentHandler,
  });
};

export default createTournament;
