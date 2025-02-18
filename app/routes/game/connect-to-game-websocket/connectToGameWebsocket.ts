import { FastifyPluginAsync } from "fastify"
import userHook from "./testPreHandler";
import gameWebsocketHandler from "../../../services/game/websocket/gameWebsocketHandler";

const gameWebsocket: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get('/', {
	  websocket: true,
	  // preHandler: AuthMiddleware
	  preHandler: userHook
	}, gameWebsocketHandler);
  };

export default gameWebsocket;