import { FastifyPluginAsync } from "fastify";
import startLobbySchema from "../../../schemas/games/lobby/startLobbySchema";
import startLobbyHandler from "../../../services/games/lobby/startLobbyHandler";

const startLobby: FastifyPluginAsync = async (
  fastify
  ): Promise<void> => {
  fastify.post("/start", {
    schema: startLobbySchema,
    handler: startLobbyHandler,
  });
};

export default startLobby;
