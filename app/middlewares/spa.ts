// app/middlewares/spa.ts
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    isAjax: () => boolean;
  }
}

export default fp(async (fastify) => {
  fastify.addHook("preHandler", async (request, reply) => {
    request.isAjax = () => {
      return (
        (request.query as any).partial === "true" ||
        request.headers["x-requested-with"] === "XMLHttpRequest"
      );
    };

    // if (request.isAjax()) {
    //   reply.locals = reply.locals || {};
    //   reply.locals.layout = null;
    // }
  });
});
