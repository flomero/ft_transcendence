import type { FastifyPluginAsync } from "fastify";
import { blockUser } from "../../services/friends/block";
import { deleteBlockedUser } from "../../services/database/friend/block";

const blockUserRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User ID required" });
    }

    try {
      await blockUser(fastify, request.userId, userId);
    } catch (error) {
      reply.status(400).send({ message: "Error blocking user" });
    }

    reply.status(200).send({ message: "User blocked" });
  });

  fastify.delete("/:userId", async (request, reply) => {
    const { userId } = request.params as { userId: string };
    if (!userId) {
      return reply.status(400).send({ message: "User ID required" });
    }

    try {
      await deleteBlockedUser(fastify, request.userId, userId);
    } catch (error) {
      reply.status(400).send({ message: "Error unblocking user" });
    }

    reply.status(200).send({ message: "User unblocked" });
  });
};

export default blockUserRoutes;
