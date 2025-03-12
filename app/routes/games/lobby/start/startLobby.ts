import { FastifyPluginAsync } from "fastify";
import startLobbyHandler from "../../../../services/games/lobby/start/startLobbyHandler";

const startLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: startLobbyHandler,
  });
};

export default startLobby;
