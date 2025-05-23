import { join } from "node:path";
import AutoLoad, { type AutoloadPluginOptions } from "@fastify/autoload";
import type {
  FastifyPluginAsync,
  FastifyServerOptions,
  FastifyInstance,
} from "fastify";
import { loadGameRegistry } from "./services/games/gameRegistryLoader";
import { loadStrategyRegistry } from "./services/strategy/strategyRegistryLoader";
import fastifyEnv from "@fastify/env";

export let fastifyInstance: FastifyInstance;

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
    NODE_ENV: { type: "string", default: "production" },
    DB_PATH: { type: "string", default: "./database/db.sqlite" },
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
      NODE_ENV: string;
      DB_PATH: string;
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

  await loadGameRegistry(fastify);
  await loadStrategyRegistry(fastify);

  fastifyInstance = fastify;

  await fastify.register(require("@fastify/swagger"));
  await fastify.register(import("@fastify/swagger-ui"), {
    routePrefix: "/documentation",
  });

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
  fastify.ready(() => {
    fastifyInstance = fastify;
  });
};

export default app;
export { app, options };
