import { FastifyPluginAsync } from "fastify";
import chatWebSocket from "./websocket";
import { getChatMessagesForRoom } from "../../services/chat/message";

const chat: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    const messages = await getChatMessagesForRoom(fastify, 1, request.userId);

    const data = {
      messages: messages,
      rooms: [
        {
          name: "John Doe",
          id: 1,
          avatar:
            "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F332729812%2Ffigure%2Ffig3%2FAS%3A753019561984003%401556545262420%2FWebsocket-work-flow-chart.png&f=1&nofb=1&ipt=aa8b70922327ebb2548dae4ec4db93e56cc45ff0c5ec8d555293d3857670aaae&ipo=images",
        },
        {
          name: "Jane Doe",
          id: 2,
          avatar:
            "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.researchgate.net%2Fpublication%2F332729812%2Ffigure%2Ffig3%2FAS%3A753019561984003%401556545262420%2FWebsocket-work-flow-chart.png&f=1&nofb=1&ipt=aa8b70922327ebb2548dae4ec4db93e56cc45ff0c5ec8d555293d3857670aaae&ipo=images",
        },
      ],
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/chat", data, viewOptions);
  });

  fastify.get("/:roomId", async function (request, reply) {
    const { roomId } = request.params as { roomId: number };
    if (!roomId) {
      return reply.status(400).send({ error: "Room ID is required" });
    }

    const messages = await getChatMessagesForRoom(
      fastify,
      roomId,
      request.userId,
    );

    const data = {
      messages: messages,
    };

    return reply.view("components/chat/messages", data);
  });

  fastify.register(chatWebSocket);
};

export default chat;
