import { join } from "node:path";
import AutoLoad, { type AutoloadPluginOptions } from "@fastify/autoload";
import type { FastifyPluginAsync, FastifyServerOptions } from "fastify";
import { loadGameRegistry } from "./services/games/gameRegistryLoader";
import { loadStrategyRegistry } from "./services/strategy/strategyRegistryLoader";

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
  await loadGameRegistry();
  await loadStrategyRegistry();

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
};

export default app;
export { app, options };
