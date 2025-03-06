import { FastifyRequest, FastifyReply } from "fastify";

async function startLobbyHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: "Lobby started" });
}

export default startLobbyHandler;
