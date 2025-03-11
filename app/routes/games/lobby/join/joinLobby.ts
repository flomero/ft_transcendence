import { FastifyPluginAsync } from "fastify";
import joinLobbyHandler from "../../../../services/games/lobby/join/joinLobbyHandler";

const joinLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: joinLobbyHandler,
  });
};

export default joinLobby;
