import type { FastifyPluginAsync } from "fastify";
import gameWebsocketHandler from "../../services/games/gameHandler/gameWebsocketHandler";

const gameWebsocket: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    "/:gameId",
    {
      websocket: true,
    },
    gameWebsocketHandler,
  );
};

export default gameWebsocket;
