import { FastifyPluginAsync } from "fastify";
import chatWebSocket from "./websocket";
import { getMessagesWithUserInfo } from "../../services/chat/message";

interface ChatMessage {
  userName: string;
  message: string;
  timestamp: string;
  isOwnMessage: boolean;
}

const chat: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const db_messages = await getMessagesWithUserInfo(fastify, 1);

    fastify.log.debug(db_messages);

    const messages: ChatMessage[] = [];

    db_messages.forEach((message) => {
      messages.push({
        userName: message["username"],
        message: message["message"],
        timestamp: message["timestamp"],
        isOwnMessage: request.userId === message["sender_id"],
      });
    });

    const data = {
      messages: messages,
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/chat", data, viewOptions);
  });

  // Register the websocket route
  fastify.register(chatWebSocket);
};

export default chat;
