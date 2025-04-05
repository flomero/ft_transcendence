import type { FastifyPluginAsync } from "fastify";
import getPublicLobbies from "../../services/games/lobby/getters/getPublicLobbys";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const lobbies = getPublicLobbies();

    const data = {
      title: "Play Pong | Inception",
      lobbies: lobbies,
    };

    reply.header("X-Page-Title", "Play Pong | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/play", data, viewOptions);
  });
};

export default page;
