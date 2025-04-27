import fp from "fastify-plugin";
import {
  fastifyMultipart,
  type FastifyMultipartOptions,
} from "@fastify/multipart";

export default fp<FastifyMultipartOptions>(async (fastify) => {
  fastify.register(fastifyMultipart);
});
