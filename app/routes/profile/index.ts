import type { FastifyPluginAsync } from "fastify";
import updateProfile from "./update";
import { getUserById, UserWithImage } from "../../services/database/user";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const userData = await getUserById(fastify, request.userId);
    if (!userData) {
      throw new Error("No user data found.");
    }

    const data: UserWithImage = {
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
