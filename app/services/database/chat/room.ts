import { FastifyInstance } from "fastify";

export async function createChatRoom(
  fastify: FastifyInstance,
): Promise<number> {
  const sql = "INSERT INTO chat_rooms DEFAULT VALUES RETURNING id";
  const result = await fastify.sqlite.get(sql);
  fastify.log.trace(`Created chat_room with id: ${result.id}`);
  return result.id;
}

export interface ChatRoom {
  id: number;
  name: string;
}

export async function getChatRoomsForUser(
  fastify: FastifyInstance,
  userId: string,
): Promise<ChatRoom[]> {
  const sql =
    "SELECT chat_rooms.id, chat_rooms.name FROM chat_rooms JOIN r_users_chat ON chat_rooms.id = r_users_chat.room_id WHERE r_users_chat.user_id = ?";
  return await fastify.sqlite.all(sql, [userId]);
}
