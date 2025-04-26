import type { FastifyInstance } from "fastify";
import type { ChatMessageType } from "../../chat/message";

export async function saveMessage(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
  message: string,
  type: ChatMessageType,
): Promise<void> {
  fastify.log.info(
    "Saving message %s from user %s in room %s with type %s",
    message,
    userId,
    roomId,
    type,
  );
  const sql =
    "INSERT INTO messages (room_id, sender_id, message, type) VALUES (?, ?, ?, ?)";
  await fastify.sqlite.run(sql, [roomId, userId, message, type]);
  fastify.log.trace(
    "Inserted message %s from user %s in room %s with type %s",
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
