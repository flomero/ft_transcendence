import type { FastifyPluginAsync } from "fastify";
import joinMatchMakingHandler from "../../../../services/games/matchMaking/join/joinMatchMakingHandler";

const joinMatchMaking: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    handler: joinMatchMakingHandler,
  });
};

export default joinMatchMaking;
