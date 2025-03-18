import type { FastifyPluginAsync } from "fastify";
import { searchUsers } from "../../services/friends/search";

const getFriendsRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
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
