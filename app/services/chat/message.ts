import { FastifyInstance } from "fastify";
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
) {
  const db_messages = await getMessagesWithUserInfo(fastify, roomId);

  const messages: ChatMessage[] = [];

  db_messages.forEach((message) => {
    messages.push({
      userName: message["username"],
      message: message["message"],
      timestamp: message["timestamp"],
      isOwnMessage: userId === message["sender_id"],
    });
  });

  return messages;
}
