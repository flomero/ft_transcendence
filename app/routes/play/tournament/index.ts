import type { FastifyPluginAsync } from "fastify";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  TournamentGameModesPerBracketType,
} from "../../../config";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const data = {
      title: "Create Tournament | ft_transcendence",
      configs: TOURNAMENT_CONFIGS_REGISTRY,
    };
    reply.header("X-Page-Title", "Create Tournament | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournament/menu", data, viewOptions);
  });

  fastify.get<{
    Params: {
      tournamentConfig: string;
    };
  }>("/:tournamentConfig", async (request, reply) => {
    const config = TOURNAMENT_CONFIGS_REGISTRY[request.params.tournamentConfig];
    if (!config) return reply.notFound();

    const data = {
      title: "Choose Player Count | ft_transcendence",
      config: config,
    };
    reply.header("X-Page-Title", "Choose Player Count | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournament/count", data, viewOptions);
  });

  fastify.get<{
    Params: {
      tournamentConfig: string;
      playerCount: string;
    };
  }>("/:tournamentConfig/:playerCount", async (request, reply) => {
    const config = TOURNAMENT_CONFIGS_REGISTRY[request.params.tournamentConfig];
    if (!config) return reply.notFound();
    const gamemodes =
      TournamentGameModesPerBracketType[
        config.bracketType as keyof typeof TournamentGameModesPerBracketType
      ];
    const playerCount = Number.parseInt(request.params.playerCount, 10);

    const data = {
      title: "Choose Gamemode | ft_transcendence",
      config: config,
      count: playerCount,
      gamemodes: gamemodes,
    };
    reply.header("X-Page-Title", "Choose Gamemode | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournament/mode", data, viewOptions);
  });
};

export default page;
