import { FastifyInstance } from "fastify";

export async function createChatRoom(
  fastify: FastifyInstance,
  name: string,
): Promise<number> {
  const sql = "INSERT INTO chat_rooms (name) VALUES (?) RETURNING id";
  const result = await fastify.sqlite.get(sql, [name]);
  fastify.log.trace(`Created chat_room with id: ${result.id}`);
  return result.id;
}

export async function addUserToChatRoom(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
) {
  const sql = "INSERT INTO r_users_chat (room_id, user_id) VALUES (?, ?)";
  await fastify.sqlite.run(sql, [roomId, userId]);
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
