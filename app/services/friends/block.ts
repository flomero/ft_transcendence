import { FastifyInstance } from "fastify";
import { deleteFriendOrInvite } from "../database/friend/friends";
import { getBlockedUsers, saveBlockedUser } from "../database/friend/block";
import { usersToUserWithImages } from "../database/user";
import { getChatRoomTwoUsers } from "../database/chat/room";
import { deleteRoom } from "../chat/live";

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
  const roomId = await getChatRoomTwoUsers(fastify, userId, blockedUserId);
  if (roomId) {
    deleteRoom(fastify, roomId);
  }
  deleteFriendOrInvite(fastify, userId, blockedUserId);
  try {
    await saveBlockedUser(fastify, userId, blockedUserId);
  } catch (error) {
    throw new Error("User already blocked");
  }
}
