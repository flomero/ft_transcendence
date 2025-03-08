import { FastifyPluginAsync } from "fastify";
import {
  addChatClient,
  removeChatClient,
  sendMessage,
} from "../../services/chat/live";

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/ws", { websocket: true }, async function (socket, request) {
    fastify.log.trace("Chat client connected");

    const roomId = 1;
    addChatClient({
      socket: socket,
      roomIds: [roomId],
      userId: request.userId,
    });

    socket.on("message", async function (message) {
      fastify.log.trace("Received message: " + message);

      await sendMessage(fastify, request, message.toString(), roomId);
    });

    socket.on("close", async function () {
      fastify.log.trace("Chat client disconnected");
      removeChatClient(request.userId);
    });

    socket.on("error", async function (error) {
      fastify.log.trace("Chat client error", error);
      removeChatClient(request.userId);
    });
  });
};

export default chatWebSocket;
