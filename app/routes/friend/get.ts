import type { FastifyPluginAsync } from "fastify";
import { searchUsers } from "../../services/friends/search";

const getFriendsRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/search/:username", async (request, reply) => {
    const { username } = request.params as { username: string };
    if (!username) {
      return reply.badRequest("Username required");
    }
    if (username.length < 3) {
      return reply.badRequest("Username must be at least 3 characters");
    }

    try {
      const users = await searchUsers(fastify, request.userId, username);

      reply.status(200).send({ users: users });
    } catch (error) {
      if (error instanceof Error)
        return reply.internalServerError(error.message);
      return reply.internalServerError();
    }
  });
};

export default getFriendsRoutes;
