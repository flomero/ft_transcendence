import type { FastifyPluginAsync } from "fastify";
import getPublicLobbies from "../../services/games/lobby/getters/getPublicLobbys";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const lobbies = await getPublicLobbies(fastify);

    const data = {
      title: "Play Pong | ft_transcendence",
      lobbies: lobbies,
    };

    reply.header("X-Page-Title", "Play Pong | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/play", data, viewOptions);
  });
};

export default page;
