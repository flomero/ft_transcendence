import type { FastifyPluginAsync } from "fastify";
import { deleteFriendOrInvite } from "../../services/database/friend/friends";
import getFriendsRoutes from "./get";
import friendInvites from "./invites";
import { getChatRoomTwoUsers } from "../../services/database/chat/room";
import { deleteRoom } from "../../services/chat/live";

const friends: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(getFriendsRoutes);
  fastify.register(friendInvites);

  fastify.post("/delete/:friendId", async (request, reply) => {
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

    fastify.log.info(`Deleting friend ${request.userId} and ${friendId}`);

    const roomId = await getChatRoomTwoUsers(
      request.server,
      request.userId,
      friendId,
    );

    if (roomId) {
      deleteRoom(request.server, roomId);
    }

    reply.status(200).send({ message: "Friend deleted" });
  });
};

export default friends;
