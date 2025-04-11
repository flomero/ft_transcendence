import type { FastifyPluginAsync } from "fastify";

const page: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const data = {
      title: "Enter Code | Inception",
    };

    reply.header("X-Page-Title", "Enter Code | ft_transcendence");
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/lobby/code", data, viewOptions);
  });
};

export default page;
