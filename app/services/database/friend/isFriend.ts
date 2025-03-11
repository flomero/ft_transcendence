import { FastifyInstance } from "fastify";

export async function isFriend(
  friendId: string,
  userId: string,
  fastify: FastifyInstance,
): Promise<boolean> {
  const sql = `
  SELECT accepted FROM users_friends
  WHERE senderId = $1 AND receiverId = $2
  `;

  const userIsSender = await fastify.sqlite.get(sql, [userId, friendId]);
  const userIsReceiver = await fastify.sqlite.get(sql, [friendId, userId]);

  if (userIsSender === undefined || userIsSender.accepted === 0) return false;
  else if (userIsReceiver === undefined || userIsReceiver.accepted === 0)
    return false;
  return true;
}
