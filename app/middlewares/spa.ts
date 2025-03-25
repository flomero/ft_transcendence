// app/middlewares/spa.ts
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    isAjax: () => boolean;
  }
}

export default fp(async (fastify) => {
  fastify.addHook("onRequest", async (request, _) => {
    request.isAjax = () => {
      return (
        (request.query as any).partial === "true" ||
        request.headers["x-requested-with"] === "XMLHttpRequest"
      );
    };
  });

  fastify.addHook("onSend", async (request, reply, payload) => {
    if (!request.isAjax()) return payload;
    if (reply.getHeader("X-Page-Title")) return payload;
    reply.header("X-Page-Title", "ft_transcendence");
    return payload;
  });
});
