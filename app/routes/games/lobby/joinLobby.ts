import { FastifyPluginAsync } from "fastify";
import joinLobbySchema from "../../../schemas/games/lobby/joinLobbySchema";
import joinLobbyHandler from "../../../services/games/lobby/joinLobbyHandler";

const joinLobby: FastifyPluginAsync = async (
  fastify
  ): Promise<void> => {
  fastify.post("/join", {
    schema: joinLobbySchema,
    handler: joinLobbyHandler,
  });
};

export default joinLobby;
