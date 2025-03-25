import type { FastifyPluginAsync } from "fastify";
import { getUserById, type UserWithImage } from "../../services/database/user";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User Id required" });
    }
    const userData = await getUserById(fastify, userId);
    if (!userData) {
      return reply.status(404).send({ message: "User not found" });
    }

    const data: UserWithImage = {
      userId: userData.id,
      userName: userData.username,
      imageUrl: `/image/${userData.image_id}`,
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/user", data, viewOptions);
  });
};

export default profile;
