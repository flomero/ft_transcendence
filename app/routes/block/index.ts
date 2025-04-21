import type { FastifyPluginAsync } from "fastify";
import { blockUser } from "../../services/friends/block";
import { deleteBlockedUser } from "../../services/database/friend/block";

const blockUserRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User ID required" });
    }

    if (userId === request.userId) {
      return reply.status(400).send({ message: "Cannot block yourself" });
    }

    try {
      await blockUser(fastify, request.userId, userId);
    } catch (error) {
      return reply.status(400).send({ message: error });
    }

    return reply.status(200).send({ message: "User blocked" });
  });

  fastify.delete("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User ID required" });
    }

    try {
      await deleteBlockedUser(fastify, request.userId, userId);
    } catch (error) {
      return reply.status(400).send({ message: "Error unblocking user" });
    }

    return reply.status(200).send({ message: "User unblocked" });
  });
};

export default blockUserRoutes;
