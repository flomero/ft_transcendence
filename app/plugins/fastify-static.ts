import fp from "fastify-plugin";
import fastifyStatic from "@fastify/static";
import path from "node:path";

export default fp(async (fastify) => {
  fastify.register(fastifyStatic, {
    root: path.resolve(__dirname, "../../public"),
    prefix: "/public/",
  });
});
