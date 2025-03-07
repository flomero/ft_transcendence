import { FastifyPluginAsync } from "fastify";
import lobbyWebsocketHandler from "../../../services/games/lobby/lobbyWebsocketHandler";

const gameWebsocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/:lobbyId",
    {
      websocket: true,
    },
    lobbyWebsocketHandler,
  );
};

export default gameWebsocket;
