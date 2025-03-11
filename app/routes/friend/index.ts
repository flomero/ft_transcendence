import { FastifyPluginAsync } from "fastify";
import { FriendRequestContent } from "../../types/friends/friendRequestContent";
import { validUserInfo } from "../../services/friends/accept";
import { friendInvites } from "../../services/database/friend/friendInvites";
import { saveFriendRequest } from "../../services/database/friend/saveFriendRequest";
import { checkFriendRequest } from "../../services/friends/request";

const friends: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/request/:friendId", async function (request, reply) {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    const friendRequestContent: FriendRequestContent = {
      friendId,
      userId: request.userId,
      request,
      reply,
    };

    if (!(await checkFriendRequest(friendRequestContent))) return;

    try {
      await saveFriendRequest(friendId, request.userId, request.server);
    } catch (error) {
      reply.status(500).send({ message: "Failed to save friend request" });
      return;
    }

    reply.status(200).send({ message: "Request sent" });
  });

  fastify.post("/accept/:friendId", async function (request, reply) {
    const { friendId } = request.params as { friendId: string };
    if (!friendId) {
      return reply.status(400).send({ message: "FriendId ID required" });
    }

    const friendRequestContent: FriendRequestContent = {
      friendId,
      userId: request.userId,
      request,
      reply,
    };

    if (!(await validUserInfo(friendRequestContent))) return;
    try {
      await friendInvites(friendId, request.userId, request.server);
    } catch (error) {
      reply.status(500).send("ERROR MESSAGE: " + error);
      return;
    }

    reply.status(200).send({ message: "Request accepted" });
  });
};

export default friends;
