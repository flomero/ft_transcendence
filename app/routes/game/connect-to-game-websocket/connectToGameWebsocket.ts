import { FastifyPluginAsync } from "fastify";
import gameWebsocketHandler from "../../../services/game/websocket/gameWebsocketHandler";

const gameWebsocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/",
    {
      websocket: true,
    },
    gameWebsocketHandler,
  );
};

export default gameWebsocket;
