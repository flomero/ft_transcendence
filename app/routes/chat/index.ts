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
      users: [
        {
          name: "John Doe",
          avatar:
            "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F332729812%2Ffigure%2Ffig3%2FAS%3A753019561984003%401556545262420%2FWebsocket-work-flow-chart.png&f=1&nofb=1&ipt=aa8b70922327ebb2548dae4ec4db93e56cc45ff0c5ec8d555293d3857670aaae&ipo=images",
        },
        {
          name: "Jane Doe",
          avatar:
            "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F332729812%2Ffigure%2Ffig3%2FAS%3A753019561984003%401556545262420%2FWebsocket-work-flow-chart.png&f=1&nofb=1&ipt=aa8b70922327ebb2548dae4ec4db93e56cc45ff0c5ec8d555293d3857670aaae&ipo=images",
        },
      ],
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/chat", data, viewOptions);
  });

  fastify.register(chatWebSocket);
};

export default chat;
