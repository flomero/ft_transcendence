import type { FastifyPluginAsync } from "fastify";
import isUserInGame from "../../../services/games/gameHandler/isUserInGame";
import { gameManagers } from "../../../services/games/lobby/start/startLobbyHandler";
import {
  getUserById,
  localPlayerWithImage,
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
    let usersWithImages = usersToUserWithImages(users);
    if (gameManager.hasLocalPlayer()) {
      let localPlayer = { ...localPlayerWithImage };
      localPlayer.userId = `#${request.userId}`;
      localPlayer.imageUrl = "/image/" + localPlayerWithImage.image_id;
      localPlayer.userName = "Local B";
      usersWithImages.push(localPlayer);
      usersWithImages[0].userName = "Local A";
      usersWithImages[0].imageUrl = "/public/ws.png";
    }

    const data = {
      title: "Game | ft_transcendence",
      gameId: gameId,
      userId: request.userId,
      tps: GAME_REGISTRY.pong.serverTickrateS,
      users: usersWithImages,
    };

    reply.header("X-Page-Title", "Game | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/game/pong", data, viewOptions);
  });
};

export default page;
