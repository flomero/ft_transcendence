import { FastifyPluginAsync } from "fastify"

const newGame: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
	fastify.get('/', { websocket: true }, (socket, req) => {
	  socket.on("message", (message: string) => {
		  socket.send("pong");
	});
  });
};
export default newGame;