import { FastifyInstance } from "fastify";
import { ChatRoom, getChatRoomsForUser } from "../database/chat/room";

export async function getChatRoomsForUserView(
  fastify: FastifyInstance,
  userId: string,
): Promise<ChatRoom[]> {
  const db_rooms = await getChatRoomsForUser(fastify, userId);

  return db_rooms;
}
