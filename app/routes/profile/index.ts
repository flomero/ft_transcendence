import { FastifyPluginAsync } from "fastify";
import updateProfile from "./update";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const data = {
      userId: request.userId,
      userName: request.userName,
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/profile", data, viewOptions);
  });

  fastify.register(updateProfile);
};

export default profile;
