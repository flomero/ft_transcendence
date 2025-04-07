import type { FastifyPluginAsync } from "fastify";
import leaveMatchMakingHandler from "../../../../services/games/matchMaking/leave/leaveMatchMakingHandler";

const leaveMatchMaking: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    handler: leaveMatchMakingHandler,
  });
};

export default leaveMatchMaking;
