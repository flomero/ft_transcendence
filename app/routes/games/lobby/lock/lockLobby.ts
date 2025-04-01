import { FastifyPluginAsync } from "fastify";
import lockLobbyHandler from "../../../../services/games/lobby/lock/lockLobbyHandler";
import lockLobbySchema from "../../../../schemas/games/lobby/lockLobbySchema";

const lockLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/:state", {
    handler: lockLobbyHandler,
    schema: lockLobbySchema,
  });
};

export default lockLobby;
