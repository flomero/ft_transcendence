import type { FastifyPluginAsync } from "fastify";
import {
  gameModeArrToString,
  getLobbyGameModes,
} from "../../../services/config/gameModes";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const gamemodes = gameModeArrToString(getLobbyGameModes());
    const data = {
      title: "Create Lobby | ft_transcendence",
      gamemodes: gamemodes,
    };
    reply.header("X-Page-Title", "Create Lobby | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/lobby/menu", data, viewOptions);
  });

  fastify.get<{
    Params: {
      gameMode: string;
    };
  }>("/:gameMode", async (request, reply) => {
    const gameMode = request.params.gameMode;

    const data = {
      title: "Choose Visibility | ft_transcendence",
      gameMode: gameMode,
    };
    reply.header("X-Page-Title", "Choose Visibility Lobby | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/lobby/visibility", data, viewOptions);
  });
};

export default page;
