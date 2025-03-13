import type { FastifyPluginAsync } from "fastify";
import { pongConsumer } from "../../services/games/pong/pongConsumer";

const newPongGameWebsocket: FastifyPluginAsync = async (
  fastify,
  opts,
): Promise<void> => {
  fastify.get("/", { websocket: true }, pongConsumer);
};

export default newPongGameWebsocket;
