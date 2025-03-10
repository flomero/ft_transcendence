import { FastifyRequest, FastifyReply } from "fastify";

async function joinLobbyHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: "joined Lobby " });
}

export default joinLobbyHandler;
