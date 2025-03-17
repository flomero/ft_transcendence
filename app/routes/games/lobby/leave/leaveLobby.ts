import { FastifyPluginAsync } from "fastify";
import leaveLobbyHandler from "../../../../services/games/lobby/leave/leaveLobbyHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const leaveLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: leaveLobbyHandler,
    schema: joinLobbySchema,
  });
};

export default leaveLobby;
