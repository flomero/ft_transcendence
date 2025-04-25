import type { FastifyPluginAsync } from "fastify";
import { requestFriend } from "../../services/friends/request";
import { acceptFriendRequest } from "../../services/friends/accept";

const friendInvites: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/request/:friendId", async (request, reply) => {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) return reply.badRequest("FriendId ID required");

    try {
      const error = await requestFriend(
        request.server,
        request.userId,
        friendId,
      );
      if (error) return reply.badRequest(error);

      reply.status(200).send({ message: "Request sent" });
    } catch (error) {
      if (error instanceof Error) return reply.badRequest(error.message);
      return reply.internalServerError();
    }
  });

  fastify.post("/accept/:friendId", async (request, reply) => {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) return reply.badRequest("FriendId ID required");

    const error = await acceptFriendRequest(
      request.server,
      request.userId,
      friendId,
    );
    if (error) return reply.badRequest(error);

    reply.status(200).send({ message: "Request accepted" });
  });
};

export default friendInvites;
