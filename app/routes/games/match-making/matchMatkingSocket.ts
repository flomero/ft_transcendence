import { FastifyPluginAsync } from "fastify";
import matchMakingSocketHandler from "../../../services/games/matchMaking/matchMakingSocketHandler";

const matchMakingSocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/",
    {
      websocket: true,
    },
    matchMakingSocketHandler,
  );
};

export default matchMakingSocket;
