import fp from "fastify-plugin";
import fastifyStatic from "@fastify/static";
import path from "node:path";

export default fp(async (fastify) => {
  await fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, "../../public"),
    prefix: "/public/",
    decorateReply: true,
  });

  await fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, "../../dist/client/client"),
    prefix: "/js/",
    decorateReply: false,
  });

  await fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, "../../client"),
    prefix: "/client/",
    decorateReply: false,
  });
});
