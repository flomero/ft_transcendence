import { FastifyPluginAsync } from "fastify";

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    reply.send({ message: "Hello " + request.userName + " " + request.userId });
  });
};

export default example;
