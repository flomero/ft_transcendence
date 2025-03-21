import type { FastifyPluginAsync } from "fastify";
import { requestFriend } from "../../services/friends/request";
import { acceptFriendRequest } from "../../services/friends/accept";

const friendInvites: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/request/:friendId", async (request, reply) => {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    try {
      const error = await requestFriend(
        request.server,
        request.userId,
        friendId,
      );
      if (error) {
        reply.status(400).send({ message: error });
        return;
      }

      reply.status(200).send({ message: "Request sent" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        reply.status(400).send({ message: error.message });
      } else {
        reply.status(400).send({ message: "Unknown error" });
      }
    }
  });

  fastify.post("/accept/:friendId", async (request, reply) => {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    const error = await acceptFriendRequest(
      request.server,
      request.userId,
      friendId,
    );
    if (error) {
      reply.status(400).send({ message: error });
      return;
    }

    reply.status(200).send({ message: "Request accepted" });
  });
};

export default friendInvites;
