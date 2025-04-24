import type { FastifyPluginAsync } from "fastify";
import { isFriend } from "../../../services/database/friend/friends";
import { sendGameInviteToUser } from "../../../services/chat/live";

const inviteLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/invite/:friendId", async (request, reply) => {
    const { friendId, lobbyId } = request.params as {
      friendId: string;
      lobbyId: number;
    };
    if (!friendId || !lobbyId) {
      return reply.code(400).send({ error: "No friendId" });
    }

    if (!(await isFriend(fastify, request.userId, friendId))) {
      return reply.code(400).send({ error: "Friend not found" });
    }

    try {
      await sendGameInviteToUser(fastify, request, friendId, lobbyId);
    } catch (error) {
      return reply.code(400).send({ error: error });
    }

    return reply.code(200).send({ message: "Successfully send invite" });
  });
};

export default inviteLobby;
