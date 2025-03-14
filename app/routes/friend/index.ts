import { FastifyPluginAsync } from "fastify";
import { deleteFriendOrInvite } from "../../services/database/friend/friends";
import friendInvites from "./invites";

const friends: FastifyPluginAsync = async (fastify): Promise<void> => {
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

  fastify.register(friendInvites);
};

export default friends;
