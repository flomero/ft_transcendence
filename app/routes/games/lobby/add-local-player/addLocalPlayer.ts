import type { FastifyPluginAsync } from "fastify";
import addLocalPlayerHandler from "../../../../services/games/lobby/addLocalPlayer/addLocalPlayerHandler";
import joinLobbySchema from "../../../../schemas/games/lobby/joinLobbySchema";

const addLocalPlayerToLobby: FastifyPluginAsync = async (
  fastify,
): Promise<void> => {
  fastify.post("/:lobbyId", {
    handler: addLocalPlayerHandler,
    schema: joinLobbySchema,
  });
};

export default addLocalPlayerToLobby;
