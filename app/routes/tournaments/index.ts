import type { FastifyPluginAsync } from "fastify";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const data = {
      test: "test",
    };

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournaments", data, viewOptions);
  });
};

export default profile;
