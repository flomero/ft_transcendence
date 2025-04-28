import type { FastifyPluginAsync } from "fastify";
import tournamentWebsocketHandler from "../../../services/games/tournament/websocket/tournamentWebsocketHandler";

const tournamentWebsocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get(
    "/:tournamentId",
    {
      websocket: true,
    },
    tournamentWebsocketHandler,
  );
};

export default tournamentWebsocket;
