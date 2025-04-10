import { join } from "node:path";
import AutoLoad, { type AutoloadPluginOptions } from "@fastify/autoload";
import type { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import { loadGameRegistry } from "./services/games/gameRegistryLoader";
import { loadStrategyRegistry } from "./services/strategy/strategyRegistryLoader";
import fastifyEnv from "@fastify/env";
import { Tournament } from "./services/tournament/tournament";

const envSchema = {
  type: "object",
  required: [
    "COOKIE_SECRET",
    "JWT_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "GOOGLE_CLIENT_ID",
    "PUBLIC_URL",
  ],
  properties: {
    COOKIE_SECRET: { type: "string" },
    JWT_SECRET: { type: "string" },
    GOOGLE_CLIENT_SECRET: { type: "string" },
    GOOGLE_CLIENT_ID: { type: "string" },
    PUBLIC_URL: { type: "string" },
  },
};

declare module "fastify" {
  interface FastifyInstance {
    config: {
      COOKIE_SECRET: string;
      JWT_SECRET: string;
      GOOGLE_CLIENT_SECRET: string;
      GOOGLE_CLIENT_ID: string;
      PUBLIC_URL: string;
    };
  }
}

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {}
// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // Place here your custom code!

  // load env vars and stop the server if it fails
  fastify.register(fastifyEnv, { schema: envSchema }).ready((err) => {
    if (err) {
      fastify.log.error(err);
      fastify.close().then(() => process.exit(1));
    }
  });

  await loadGameRegistry();
  await loadStrategyRegistry();

  const tournament = new Tournament({
    bracketType: "swissRound",
    matchWinnerType: "bestOfX",
    initialSeedingMethod: "random",
    playerCount: 8,
    players: ["0", "1", "2", "3", "4", "5", "6", "7"],
    //   ,
    //   "8",
    //   "9",
    //   "10",
    //   "11",
    //   "12",
    //   "13",
    //   "14",
    //   "15",
    // ],
    gameData: {
      playerCount: 2,
    },
  });

  tournament.startTournament();

  console.log("Final results:");
  console.dir(tournament.getResults(), { depth: null });

  console.log("Final rankings:");
  console.dir(tournament.getFinalRankings(), { depth: null });

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "plugins"),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "routes"),
    options: opts,
  });

  // This loads all plugins defined in middlewares
  // define your middlewares in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, "middlewares"),
    options: opts,
  });
  fastify.ready();
};

export default app;
export { app, options };
