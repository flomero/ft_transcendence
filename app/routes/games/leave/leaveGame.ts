import type { FastifyPluginAsync } from "fastify";
import leaveGameHandler from "../../../services/games/gameHandler/leaveGame/leaveGameHandler";

const leaveGame: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", {
    handler: leaveGameHandler,
  });
};

export default leaveGame;
