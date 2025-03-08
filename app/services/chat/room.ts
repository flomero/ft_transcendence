import { FastifyInstance } from "fastify";
import { getChatRoomsForUser } from "../database/chat/room";

export interface ChatRoom {
  id: number;
  name: string;
}

export async function getChatRoomsForUserView(
  fastify: FastifyInstance,
  userId: string,
): Promise<ChatRoom[]> {
  const db_rooms = await getChatRoomsForUser(fastify, userId);

  return db_rooms.map((room) => ({
    id: room.id,
    name: room.name,
  }));
}
