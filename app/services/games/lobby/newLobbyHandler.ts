import { FastifyRequest, FastifyReply } from "fastify";

async function newLobbyHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: "new lobby" });
}

export default newLobbyHandler;
