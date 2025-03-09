import { FastifyPluginAsync } from "fastify";
import updateProfile from "./update";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const data = {};
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/chat", data, viewOptions);
  });

  fastify.register(updateProfile);
};

export default profile;
