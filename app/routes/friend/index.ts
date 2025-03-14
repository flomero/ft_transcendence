import { FastifyPluginAsync } from "fastify";
import { deleteFriendOrInvite } from "../../services/database/friend/friends";
import friendInvites from "./invites";
import { searchUsers } from "../../services/database/friend/search";

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

  fastify.get("/search/:username", async function (request, reply) {
    const { username } = request.params as { username: string };
    if (!username) {
      return reply.status(400).send({ message: "Username required" });
    }
    if (username.length < 3) {
      return reply
        .status(400)
        .send({ message: "Username must be at least 3 characters" });
    }

    const users = await searchUsers(fastify, username);

    const userData = users.map((user) => ({
      userId: user.id,
      userName: user.username,
      imageUrl: `/image/${user.image_id}`,
    }));

    reply.status(200).send({ users: userData });
  });

  fastify.register(friendInvites);
};

export default friends;
