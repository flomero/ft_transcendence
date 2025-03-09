import { FastifyPluginAsync } from "fastify";
import { updateUsername } from "../../services/database/user";

const updateProfile: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/update/username", async (request, reply) => {
    if (!request.isAuthenticated) {
      return reply
        .code(401)
        .send({ error: "You are not authorized to authenticate" });
    }

    let newUsername = request.body as string;
    newUsername = newUsername.trim();
    if (newUsername.length < 3) {
      return reply
        .code(400)
        .send({ error: "Username must be at least 3 characters long" });
    }

    if (!(await updateUsername(fastify, request.userId, newUsername))) {
      return reply.code(500).send({ error: "Failed to update username" });
    }
    return reply.code(200).send({});
  });
};

export default updateProfile;
