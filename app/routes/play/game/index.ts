import type { FastifyPluginAsync } from "fastify";
import isUserInGame from "../../../services/games/gameHandler/isUserInGame";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:gameId", async (request, reply) => {
    const { gameId } = request.params as { gameId: string };
    if (!gameId) return reply.notFound();
    if (isUserInGame(request.userId) != gameId) return reply.notFound();

    const data = {
      title: "Game | ft_transcendence",
      gameId: gameId,
    };

    reply.header("X-Page-Title", "Game | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/game/pong", data, viewOptions);
  });
};

export default page;
