import { FastifyInstance } from "fastify";
import { deleteFriendOrInvite } from "../database/friend/friends";
import { getBlockedUsers, saveBlockedUser } from "../database/friend/block";
import { usersToUserWithImages } from "../database/user";

export async function getBlockedUsersWithUserInfo(
  fastify: FastifyInstance,
  userId: string,
) {
  const blockedUsers = await getBlockedUsers(fastify, userId);

  return usersToUserWithImages(blockedUsers);
}

export async function blockUser(
  fastify: FastifyInstance,
  userId: string,
  blockedUserId: string,
) {
  await deleteFriendOrInvite(fastify, userId, blockedUserId);
  await saveBlockedUser(fastify, userId, blockedUserId);
}
