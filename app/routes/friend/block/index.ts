import type { FastifyPluginAsync } from "fastify";
import { blockUser } from "../../../services/friends/block";
import { deleteBlockedUser } from "../../../services/database/friend/block";

const blockUserRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) return reply.badRequest("User ID required");

    if (userId === request.userId)
      return reply.badRequest("Cannot block yourself");

    try {
      await blockUser(fastify, request.userId, userId);
    } catch (error) {
      return reply.badRequest("Error blocking user");
    }

    return reply.status(200).send({ message: "User blocked" });
  });

  fastify.delete("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) return reply.badRequest("User ID required");

    try {
      const changes = (await deleteBlockedUser(fastify, request.userId, userId))
        .changes;
      if (changes === 0) return reply.badRequest("User not blocked");
    } catch (error) {
      return reply.badRequest("Error unblocking user");
    }

    return reply.status(200).send({ message: "User unblocked" });
  });
};

export default blockUserRoutes;
