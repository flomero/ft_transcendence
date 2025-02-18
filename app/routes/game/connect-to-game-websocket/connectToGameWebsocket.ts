import { FastifyPluginAsync } from "fastify"
import { userHook } from "./testPreHandler";
import gameWebsocketHandler from "../../../services/game/websocket/gameWebsocketHandler";
import { hookSchema } from "./testPreHandler";

const gameWebsocket: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get('/', {
	  websocket: true,
	  // preHandler: AuthMiddleware
    schema: hookSchema,
	  preHandler: userHook
	}, gameWebsocketHandler);
  };

export default gameWebsocket;
