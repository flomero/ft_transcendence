import type { FastifyRequest, FastifyReply } from "fastify";
import { matchMakingManager } from "../join/joinMatchMakingHandler";

const leaveMatchMakingHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.userId;
  try {
    if (matchMakingManager.memberExists(userId) == false) {
      throw new Error("You are not in the matchmaking");
    }
    matchMakingManager.removeMemberSocket(userId);
    matchMakingManager.removeMember(userId);
  } catch (error) {
    if (error instanceof Error) {
      return reply.status(400).send({ message: error.message });
    }
  }
  return reply.status(200).send({ message: "left matchmaking" });
};

export default leaveMatchMakingHandler;
