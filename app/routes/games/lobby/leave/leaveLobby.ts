import { FastifyPluginAsync } from "fastify";
import leaveLobbyHandler from "../../../../services/games/lobby/leave/leaveLobbyHandler";

const leaveLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: leaveLobbyHandler,
  });
};

export default leaveLobby;
