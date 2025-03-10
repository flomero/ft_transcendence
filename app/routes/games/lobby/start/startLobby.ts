import { FastifyPluginAsync } from "fastify";
import startLobbySchema from "../../../../schemas/games/lobby/startLobbySchema";
import startLobbyHandler from "../../../../services/games/lobby/start/startLobbyHandler";

const startLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    schema: startLobbySchema,
    handler: startLobbyHandler,
  });
};

export default startLobby;
