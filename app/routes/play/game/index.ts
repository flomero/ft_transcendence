import type { FastifyPluginAsync } from "fastify";
import isUserInGame from "../../../services/games/gameHandler/isUserInGame";
import { gameManagers } from "../../../services/games/lobby/start/startLobbyHandler";
import {
  getUserById,
  type User,
  usersToUserWithImages,
} from "../../../services/database/user";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:gameId", async (request, reply) => {
    const { gameId } = request.params as { gameId: string };
    if (!gameId) return reply.notFound();
    if (isUserInGame(request.userId) !== gameId) return reply.notFound();

    const gameManager = gameManagers.get(gameId);
    if (gameManager === undefined) return reply.notFound();
    const referenceTable = gameManager.getReferenceTable();
    const users: User[] = [];
    for (const userId of referenceTable) {
      const user = await getUserById(fastify, userId);
      if (user) users.push(user);
    }

    const data = {
      title: "Game | ft_transcendence",
      gameId: gameId,
      userId: request.userId,
      tps: GAME_REGISTRY.pong.serverTickrateS,
      users: usersToUserWithImages(users),
    };

    reply.header("X-Page-Title", "Game | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/game/pong", data, viewOptions);
  });
};

export default page;
