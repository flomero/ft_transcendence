import { FastifyPluginAsync } from "fastify";
import lobbyWebsocketHandler from "../../../services/games/lobby/lobbyWebsocket/lobbyWebsocketHandler";

const matchMakingSocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/",
    {
      websocket: true,
    },
    lobbyWebsocketHandler,
  );
};

export default matchMakingSocket;
