import MatchMakingManager from "../MatchMakingManager";
import type { FastifyRequest, FastifyReply } from "fastify";

export const matchMakingManager = new MatchMakingManager();

const joinMatchMakingHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.userId;
  try {
    if (matchMakingManager.memberExists(userId) === true) {
      throw new Error("User already in MatchMaking");
    }
    matchMakingManager.addMember(userId);
  } catch (error) {
    if (error instanceof Error)
      return reply.status(400).send({ message: error.message });
  }
  return reply.status(200).send({ message: "joined MatchMaking" });
};

export default joinMatchMakingHandler;
