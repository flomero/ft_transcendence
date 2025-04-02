import { FastifyPluginAsync } from "fastify";
import lobbyWebsocketHandler from "../../../services/games/lobby/lobbyWebsocket/lobbyWebsocketHandler";

const gameWebsocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/:gameId",
    {
      websocket: true,
    },
    lobbyWebsocketHandler,
  );
};

export default gameWebsocket;
