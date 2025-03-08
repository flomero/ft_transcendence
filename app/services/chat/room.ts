import { FastifyInstance } from "fastify";

export async function createChatRoom(
  fastify: FastifyInstance,
): Promise<number> {
  const sql = "INSERT INTO chat_rooms DEFAULT VALUES RETURNING id";
  const result = await fastify.sqlite.get(sql);
  fastify.log.trace(`Created chat_room with id: ${result.id}`);
  return result.id;
}

export async function getChatRoomsForUser(
  fastify: FastifyInstance,
  userId: string,
): Promise<any[]> {
  const sql = "SELECT * FROM chat_rooms WHERE user_id = ?";
  return await fastify.sqlite.all(sql, [userId]);
}
