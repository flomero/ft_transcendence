import { FastifyRequest, FastifyReply } from "fastify";

async function leaveLobbyHandler(request: FastifyRequest, reply: FastifyReply) {
  reply.send({ message: "You removed yourself from the lobby" });
}

export default leaveLobbyHandler;
