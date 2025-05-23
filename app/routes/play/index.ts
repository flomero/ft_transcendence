import type { FastifyPluginAsync } from "fastify";
import getPublicLobbies from "../../services/games/lobby/getters/getPublicLobbys";
import type { FastifyRequest, FastifyReply } from "fastify";
import { isUserInMatchMaking } from "../../services/games/matchMaking/MatchMakingManager";
import { isUserInAnyLobby } from "../../services/games/lobby/lobbyVaidation/isUserInAnyLobby";
import isUserInGame from "../../services/games/gameHandler/isUserInGame";
import {
  getMatchmakingGameModes,
  gameModeArrToString,
} from "../../services/config/gameModes";
import { getTournamentsWithOwners } from "../../services/games/tournament/tournaments";
import isMemberInAnyTournament from "../../services/games/tournament/tournamentValidation/isMemberInAnyTournament";

const checkRedirects = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> => {
  const redirects = [
    {
      check: () => isUserInGame(request.userId),
      path: (id: string) => `/play/game/${id}`,
    },
    {
      check: () => isUserInMatchMaking(request.userId),
      path: (mode: string) => `/games/matchmaking/join/${mode}`,
    },
    {
      check: () => isUserInAnyLobby(request.userId),
      path: (id: string) => `/games/lobby/join/${id}`,
    },
    {
      check: () => isMemberInAnyTournament(request.userId),
      path: (id: string) => `/games/tournament/join/${id}`,
    },
  ];

  for (const redirect of redirects) {
    const result = redirect.check();
    if (result) {
      reply.redirect(redirect.path(result));
      return true;
    }
  }
  return false;
};

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    if (await checkRedirects(request, reply)) return;

    const lobbies = await getPublicLobbies(fastify);
    const gamemodes = gameModeArrToString(getMatchmakingGameModes());
    const tournaments = await getTournamentsWithOwners(fastify);
    const data = {
      title: "Play Pong | ft_transcendence",
      lobbies: lobbies,
      tournaments: tournaments,
      matchmakingmodes: gamemodes,
      // debugString: JSON.stringify(tournaments),
    };

    fastify.log.debug(data.matchmakingmodes);

    reply.header("X-Page-Title", "Play Pong | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/play", data, viewOptions);
  });
};

export default page;
