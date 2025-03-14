import { FastifyInstance } from "fastify";
import { acceptInvite, hasInvite } from "../database/friend/invites";
import { saveFriend } from "../database/friend/friends";

export async function acceptFriendRequest(
  fastify: FastifyInstance,
  user_id: string,
  friend_id: string,
): Promise<string | undefined> {
  if (!(await hasInvite(fastify, friend_id, user_id))) {
    return "No invite found";
  }

  await acceptInvite(fastify, friend_id, user_id);
  await saveFriend(fastify, user_id, friend_id);

  return undefined;
}
