import type { FastifyPluginAsync } from "fastify";
import newLobbySchema from "../../../../schemas/games/lobby/newLobbySchema";
import newLobbyHandler from "../../../../services/games/lobby/new/newLobbyHandler";

const newLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/", {
    schema: newLobbySchema,
    handler: newLobbyHandler,
  });
};

export default newLobby;
