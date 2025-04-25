import type { FastifyPluginAsync } from "fastify";
import addAIOpponentHandler from "../../../../services/games/lobby/addAIOpponent/addAIOpponentHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const addAIOpponentToLobby: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: addAIOpponentHandler,
    schema: joinLobbySchema,
  });
};

export default addAIOpponentToLobby;
