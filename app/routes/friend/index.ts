import { FastifyPluginAsync } from "fastify";
import { acceptFriendRequest } from "../../services/friends/accept";
import { requestFriend } from "../../services/friends/request";

const friends: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/request/:friendId", async function (request, reply) {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    const error = await requestFriend(request.server, request.userId, friendId);
    if (error) {
      reply.status(400).send({ message: error });
      return;
    }

    reply.status(200).send({ message: "Request sent" });
  });

  fastify.post("/accept/:friendId", async function (request, reply) {
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

export default friends;
