import { FastifyInstance } from "fastify";
import { ChatMessageType } from "../../chat/message";

export async function saveMessage(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
  message: string,
  type: ChatMessageType = ChatMessageType.text,
): Promise<void> {
  const sql =
    "INSERT INTO messages (room_id, sender_id, message, type) VALUES (?, ?, ?, ?)";
  await fastify.sqlite.run(sql, [roomId, userId, message, type]);
  fastify.log.trace(
    "Inserted message %s from user %s in room %s with type %s",
    message,
    userId,
    roomId,
    type,
  );
}

export async function getMessages(
  fastify: FastifyInstance,
  roomId: number,
): Promise<any[]> {
  const sql = "SELECT * FROM messages WHERE room_id = ?";
  return await fastify.sqlite.all(sql, [roomId]);
}

export async function getMessagesWithUserInfo(
  fastify: FastifyInstance,
  roomId: number,
): Promise<any[]> {
  const sql =
    "SELECT messages.*, users.username FROM messages JOIN users ON messages.sender_id = users.id WHERE room_id = ?";
  return await fastify.sqlite.all(sql, [roomId]);
}
