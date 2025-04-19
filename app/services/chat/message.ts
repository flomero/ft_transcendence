import type { FastifyInstance } from "fastify";
import { getMessagesWithUserInfo } from "../database/chat/message";

export interface ChatMessage {
  userName: string;
  message: string;
  timestamp: string;
  isOwnMessage: boolean;
}

export async function getChatMessagesForRoom(
  fastify: FastifyInstance,
  roomId: number,
  userId: string,
): Promise<ChatMessage[]> {
  const db_messages = await getMessagesWithUserInfo(fastify, roomId);

  return db_messages.map((message) => ({
    userName: message["username"],
    message: message["message"],
    timestamp: message["timestamp"],
    isOwnMessage: userId === message["sender_id"],
  }));
}
