import type { FastifyPluginAsync } from "fastify";
import {
  gameModeArrToString,
  gameModeFromString,
  getLobbyGameModes,
} from "../../../services/config/gameModes";
import { GAMEMODE_REGISTRY, LobbyGameModes } from "../../../config";
import { isUserInAnyLobby } from "../../../services/games/lobby/lobbyVaidation/isUserInAnyLobby";
import { Lobby } from "../../../services/games/lobby/Lobby";
import { setLobby } from "../../../services/games/lobby/new/setLobby";
import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import {
  GAME_MODES,
  GAME_NAMES,
} from "../../../schemas/games/lobby/newLobbySchema";
import { STRATEGY_REGISTRY } from "../../../services/strategy/strategyRegistryLoader";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";

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

  fastify.get<{
    Params: {
      gameMode: string;
      visibility: string;
    };
  }>("/:gameMode/:visibility", async (request, reply) => {
    try {
      const visibility = request.params.visibility;
      if (visibility !== "public" && visibility !== "private")
        return reply.badRequest();
      const gameModeString = request.params.gameMode;
      const gameMode = gameModeFromString(gameModeString, LobbyGameModes);
      if (gameMode === null) return reply.notFound("Game mode does not exist");
      if (isUserInAnyLobby(request.userId) !== null)
        return reply.redirect("/play");
      const gameModeSettings = GAMEMODE_REGISTRY[
        gameMode as keyof typeof GAMEMODE_REGISTRY
      ] as GameSettings | undefined;
      if (!gameModeSettings) return reply.notFound("Game mode does not exist");
      const lobby = new Lobby(gameModeSettings, request.userId);
      setLobby(lobby, visibility);
      reply.redirect(`/games/lobby/join/${lobby.getLobbyId}`);
    } catch (error) {
      return reply.internalServerError(
        "An error occurred while creating the lobby",
      );
    }
  });

  fastify.get("/custom", async (request, reply) => {
    const data = {
      title: "Create Custom Game Lobby | ft_transcendence",
      gameNames: Object.values(GAME_NAMES),
      gameModes: Object.values(GAME_MODES),
      positionSamplers: Object.keys(
        STRATEGY_REGISTRY.pongPowerUpPositionSampler,
      ),
      ballResetSamplers: Object.keys(STRATEGY_REGISTRY.pongBallResetSampler),
      playerSamplers: Object.keys(STRATEGY_REGISTRY.pongPlayerSampler),
      powerUpNames: Object.keys(GAME_REGISTRY.pong.powerUps),
    };
    reply.header("X-Page-Title", "Create Custom Game Lobby | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/lobby/custom", data, viewOptions);
  });
};

export default page;
