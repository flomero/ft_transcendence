import type { FastifyPluginAsync } from "fastify";
import { isFriend } from "../../../services/database/friend/friends";
import { sendGameInviteToUser } from "../../../services/chat/live";

const inviteLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/invite/:friendId", async (request, reply) => {
    const { friendId, lobbyId } = request.params as {
      friendId: string;
      lobbyId: number;
    };
    if (!friendId || !lobbyId) return reply.badRequest("No friendId");

    if (!(await isFriend(fastify, request.userId, friendId)))
      return reply.badRequest("Friend not found");

    try {
      await sendGameInviteToUser(fastify, request, friendId, lobbyId);
    } catch (error) {
      if (error instanceof Error) return reply.badRequest(error.message);
      return reply.badRequest("Error sending invite");
    }

    return reply.code(200).send({ message: "Successfully send invite" });
  });
};

export default inviteLobby;
