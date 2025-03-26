import { FastifyPluginAsync } from "fastify";
import joinLobbyHandler from "../../../../services/games/lobby/join/joinLobbyHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const joinLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: joinLobbyHandler,
    schema: joinLobbySchema,
  });
};

export default joinLobby;
