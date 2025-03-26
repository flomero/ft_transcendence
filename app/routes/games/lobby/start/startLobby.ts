import { FastifyPluginAsync } from "fastify";
import startLobbyHandler from "../../../../services/games/lobby/start/startLobbyHandler";
import startLobbySchema from "../../../../schemas/games/lobby/startLobbySchema";

const startLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: startLobbyHandler,
    schema: startLobbySchema,
  });
};

export default startLobby;
