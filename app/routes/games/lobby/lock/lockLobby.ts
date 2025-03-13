import { FastifyPluginAsync } from "fastify";
import lockLobbyHandler from "../../../../services/games/lobby/lock/lockLobbyHandler";

const lockLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/:state", {
    handler: lockLobbyHandler,
  });
};

export default lockLobby;
