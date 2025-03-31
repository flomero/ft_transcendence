import MatchMatkingManager from "../MatchMakingManager";
import { FastifyRequest, FastifyReply } from "fastify";

export const matchMakingManager = new MatchMatkingManager();

const joinMatchMakingHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const userId = request.userId;
  matchMakingManager.addMember(userId);
  reply.status(200).send({ message: "Joined MatchMaking" });
};

export default joinMatchMakingHandler;
