import type { FastifyPluginAsync } from "fastify";
import { searchUsers } from "../../services/friends/search";
import { getInvitesWithUserInfo } from "../../services/database/friend/invites";
import { getFriendsWithUserInfo } from "../../services/database/friend/friends";
import { usersToUserWithImages } from "../../services/database/user";

const getFriendsRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/list", async (request, reply) => {
    const friends = await getFriendsWithUserInfo(fastify, request.userId);

    reply.status(200).send({ friends: usersToUserWithImages(friends) });
  });

  fastify.get("/invites", async (request, reply) => {
    const invites = await getInvitesWithUserInfo(fastify, request.userId);

    reply.status(200).send({ invites: usersToUserWithImages(invites) });
  });

  fastify.get("/search/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    if (!username) {
      return reply.status(400).send({ message: "Username required" });
    }
    if (username.length < 3) {
      return reply
        .status(400)
        .send({ message: "Username must be at least 3 characters" });
    }

    try {
      const users = await searchUsers(fastify, request.userId, username);

      reply.status(200).send({ users: users });
    } catch (error) {
      reply.status(500).send({ message: `Internal server error ${error}` });
    }
  });
};

export default getFriendsRoutes;
