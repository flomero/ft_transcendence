import { FastifyInstance } from "fastify";
import {
  createInvite,
  hasInvite,
  acceptInvite,
} from "../database/friend/invites";
import { isFriend, saveFriend } from "../database/friend/friends";

export async function requestFriend(
  fastify: FastifyInstance,
  userId: string,
  friendId: string,
): Promise<string | undefined> {
  if (userId === friendId) {
    return "Cannot send request to yourself";
  }
  if (await hasInvite(fastify, userId, friendId)) {
    return "Request already sent";
  }
  if (await isFriend(fastify, userId, friendId)) {
    return "User is already a friend";
  }
  if (await hasInvite(fastify, friendId, userId)) {
    await acceptInvite(fastify, friendId, userId);
    await saveFriend(fastify, userId, friendId);
    return undefined;
  }

  await createInvite(fastify, userId, friendId);

  return undefined;
}
