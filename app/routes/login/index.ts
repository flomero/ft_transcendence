import { FastifyPluginAsync } from "fastify";

const login: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };

    return reply.view("views/login", {}, viewOptions);
  });
};

export default login;
