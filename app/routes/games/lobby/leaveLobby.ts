import { FastifyPluginAsync } from "fastify";
import leaveLobbySchema from "../../../schemas/games/lobby/leaveLobbySchema";
import leaveLobbyHandler from "../../../services/games/lobby/leaveLobbyHandler";

const leaveLobby: FastifyPluginAsync = async (
  fastify
  ): Promise<void> => {
  fastify.post("/leave", {
    schema: leaveLobbySchema,
    handler: leaveLobbyHandler,
  });
};

export default leaveLobby;
