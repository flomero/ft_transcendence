import type { FastifyPluginAsync } from "fastify";
import { deleteFriendOrInvite } from "../../services/database/friend/friends";
import getFriendsRoutes from "./get";

const friends: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.register(getFriendsRoutes);

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

    reply.status(200).send({ message: "Friend deleted" });
  });
};

export default friends;
