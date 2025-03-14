import { FastifyInstance } from "fastify";
import { acceptInvite, hasInvite } from "../database/friend/invites";
import { saveFriend } from "../database/friend/friends";
import { addRoom } from "../chat/live";

export async function acceptFriendRequest(
  fastify: FastifyInstance,
  user_id: string,
  friend_id: string,
): Promise<string | undefined> {
  if (!(await hasInvite(fastify, friend_id, user_id))) {
    return "No invite found";
  }

  await acceptFriendRequestAndAddRoom(fastify, user_id, friend_id);

  return undefined;
}

export async function acceptFriendRequestAndAddRoom(
  fastify: FastifyInstance,
  user_id: string,
  friend_id: string,
) {
  await acceptInvite(fastify, friend_id, user_id);
  await saveFriend(fastify, user_id, friend_id);

  await addRoom(fastify, `${user_id} and ${friend_id}`, [user_id, friend_id]);
}
