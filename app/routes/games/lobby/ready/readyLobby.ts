import type { FastifyPluginAsync } from "fastify";
import readyLobbyHandler from "../../../../services/games/lobby/ready/readyLobbyHandler";
import lockLobbySchema from "../../../../schemas/games/lobby/lockLobbySchema";

const readyLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/:state", {
    handler: readyLobbyHandler,
    schema: lockLobbySchema,
  });
};

export default readyLobby;
