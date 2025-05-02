import { MatchmakingGameModes } from "../../../../config";
import { gameModeFromString } from "../../../config/gameModes";
import { matchMakingManager } from "../MatchMakingManager";
import type { FastifyRequest, FastifyReply } from "fastify";

const joinMatchMakingHandler = async (
  request: FastifyRequest<{ Params: { gameMode: string } }>,
  reply: FastifyReply,
) => {
  const gameModeString = request.params.gameMode;
  const gameMode = gameModeFromString(gameModeString, MatchmakingGameModes);
  if (gameMode === null) {
    return reply.notFound("Game mode does not exist");
  }

  const userId = request.userId;
  matchMakingManager.addMember(userId, gameMode);

  const data = {
    title: "Matchmaking | ft_transcendence",
    gameMode: gameMode,
  };
  reply.header("X-Page-Title", "Matchmaking | ft_transcendence");
  const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
  return reply.view("views/matchmaking/page", data, viewOptions);
};

export default joinMatchMakingHandler;
