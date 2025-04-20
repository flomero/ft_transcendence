import { FastifyInstance } from "fastify";

export async function saveMessage(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
  message: string,
): Promise<void> {
  const sql =
    "INSERT INTO messages (room_id, sender_id, message) VALUES (?, ?, ?)";
  await fastify.sqlite.run(sql, [roomId, userId, message]);
  fastify.log.trace(
    "Inserted message %s from user %s in room %s",
    message,
    userId,
    roomId,
  );
}

export async function getMessagesWithUserInfo(
  fastify: FastifyInstance,
  userId: string,
  roomId: number,
): Promise<any[]> {
  const sql = `SELECT messages.*, users.username
    FROM messages
    LEFT JOIN users ON messages.sender_id = users.id
    LEFT JOIN users_blocked ON messages.sender_id = users_blocked.blockedUserId 
      AND users_blocked.userId = ?
    WHERE room_id = ? AND users_blocked.blockedUserId IS NULL`;
  return await fastify.sqlite.all(sql, [userId, roomId]);
}
