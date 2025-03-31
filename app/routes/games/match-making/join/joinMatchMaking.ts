import { FastifyPluginAsync } from "fastify";
import startLobbyHandler from "../../../../services/games/lobby/start/startLobbyHandler";
import startLobbySchema from "../../../../schemas/games/lobby/startLobbySchema";

const joinMatchMaking: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    handler: startLobbyHandler,
    schema: startLobbySchema,
  });
};

export default joinMatchMaking;
