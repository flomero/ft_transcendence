import { FastifyPluginAsync } from "fastify";
import readyLobbyHandler from "../../../../services/games/lobby/ready/readyLobbyHandler";

const readyLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/:state", {
    handler: readyLobbyHandler,
    //scheama: { Params: { lobbyId: { type: "string" }, state: { enum: ["true", "false"] } } },
  });
};

export default readyLobby;
