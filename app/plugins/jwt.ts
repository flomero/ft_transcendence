import fp from "fastify-plugin";
import jwt, { type FastifyJWTOptions } from "@fastify/jwt";

export default fp<FastifyJWTOptions>(async (fastify) => {
  fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET,
  });
});
