import { FastifyPluginAsync } from "fastify";
import newLobbySchema from "../../../schemas/games/lobby/newLobbySchema";
import startLobbyHandeler from "../../../services/games/lobby/startLobbyHandler";

const startLobby: FastifyPluginAsync = async (
  fastify
  ): Promise<void> => {
  fastify.post("/start", {
    schema: newLobbySchema,
    handler: startLobbyHandeler,
  });
};

export default startLobby;
