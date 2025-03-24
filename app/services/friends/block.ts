import { FastifyInstance } from "fastify";
import { getBlockedUsers } from "../database/friend/block";
import { usersToUserWithImages } from "../database/user";

export async function getBlockedUsersWithUserInfo(
  fastify: FastifyInstance,
  userId: string,
) {
  const blockedUsers = await getBlockedUsers(fastify, userId);

  return usersToUserWithImages(blockedUsers);
}
