import { FastifyRequest, FastifyReply } from "fastify";

export interface FriendRequestContent {
  friendId: string;
  userId: string;
  request: FastifyRequest;
  reply: FastifyReply;
}
