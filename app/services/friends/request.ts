import type { FastifyInstance } from "fastify";
import { createInvite, hasInvite } from "../database/friend/invites";
import { acceptFriendRequestAndAddRoom } from "./accept";
import { isFriend } from "../database/friend/friends";
import { userExists } from "../database/user";

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
    await acceptFriendRequestAndAddRoom(fastify, userId, friendId);
    return undefined;
  }
  if (!(await userExists(fastify, friendId))) {
    return "User does not exist";
  }

  await createInvite(fastify, userId, friendId);

  return undefined;
}
