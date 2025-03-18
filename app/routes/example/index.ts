import type { FastifyPluginAsync } from "fastify";

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const data = {
      userId: "059e0045cb5e",
      userName: "flo",
      imageUrl: "/image/85351d21-2cb8-40c9-98e3-059e0045cb5e",
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/test", data, viewOptions);
  });
};

export default example;
