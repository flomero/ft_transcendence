import { FastifyPluginAsync } from "fastify";
import lockLobbyHandler from "../../../../services/games/lobby/lock/lockLobbyHandler";

const lockLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: lockLobbyHandler,
  });
};

export default lockLobby;
