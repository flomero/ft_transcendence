import { FastifyPluginAsync } from "fastify";
import { acceptFriendRequest } from "../../services/friends/accept";
import { requestFriend } from "../../services/friends/request";
import { deleteFriendOrInvite } from "../../services/database/friend/friends";

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

  fastify.post("/delete/:friendId", async function (request, reply) {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    const changes = await deleteFriendOrInvite(
      request.server,
      request.userId,
      friendId,
    );

    if (changes === 0) {
      reply.status(400).send({ message: "Friend or invite not found" });
      return;
    }

    reply.status(200).send({ message: "Friend deleted" });
  });
};

export default friends;
