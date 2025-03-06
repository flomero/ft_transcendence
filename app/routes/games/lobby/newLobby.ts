import { FastifyPluginAsync } from "fastify";
import newLobbySchema from "../../../schemas/games/lobby/newLobbySchema";
import newLobbyHandler from "../../../services/games/lobby/newLobbyHandler";

const createLobby: FastifyPluginAsync = async (
  fastify
  ): Promise<void> => {
  fastify.post("/new", {
    schema: newLobbySchema,
    handler: newLobbyHandler,
  });
};

export default createLobby;
