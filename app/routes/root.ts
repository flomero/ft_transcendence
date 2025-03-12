import type { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view(
      "views/home",
      {
        title: "ft_transcendence",
        isAuthenticated: request.isAuthenticated,
        userId: request.userId,
        userName: request.userName,
      },
      viewOptions,
    );
  });

  fastify.get("/health", async () => ({ status: "ok" }));
};

export default root;
