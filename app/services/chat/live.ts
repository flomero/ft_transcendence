import { FastifyInstance, FastifyRequest } from "fastify";
import { saveMessage } from "../database/chat/message";

interface ChatClient {
  socket: any;
  roomIds: number[];
  userId: string;
}

const chatClients: ChatClient[] = [];

export function addChatClient(client: ChatClient) {
  chatClients.push(client);
}

export function removeChatClient(userId: string) {
  chatClients.splice(
    chatClients.findIndex((client) => client.userId === userId),
    1,
  );
}

interface ChatWebSocketResponse {
  type: "message" | "room";
  id: number;
  html: string;
}

export async function sendMessage(
  fastify: FastifyInstance,
  request: FastifyRequest,
  message: string,
  roomId: number,
) {
  for (const client of chatClients) {
    if (!client.roomIds.includes(roomId)) {
      continue;
    }

    const html = await fastify.view("components/chat/message", {
      message: {
        userName: request.userName,
        message: message,
        timestamp: new Date().toLocaleString(),
        isOwnMessage: client.userId === request.userId,
      },
    });

    const response: ChatWebSocketResponse = {
      type: "message",
      id: roomId,
      html: html,
    };

    client.socket.send(JSON.stringify(response));
  }

  await saveMessage(fastify, roomId, request.userId, message);
}
