import type { FastifyPluginAsync } from "fastify";
import updateProfile from "./update";
import { getUserById } from "../../services/database/user";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const userData = await getUserById(fastify, request.userId);
    if (!userData) {
      return reply.code(404).send("No user data found.");
    }

    const data = {
      userId: request.userId,
      userName: request.userName,
      imageUrl: `/image/${userData.image_id}`,
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/profile", data, viewOptions);
  });

  fastify.register(updateProfile);
};

export default profile;
