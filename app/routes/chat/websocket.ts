import { FastifyPluginAsync } from "fastify";
import { addChatClient, removeChatClient } from "../../services/chat/live";
import { getChatRoomsForUser } from "../../services/database/chat/room";

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/ws", { websocket: true }, async function (socket, request) {
    fastify.log.trace("Chat client connected");

    const rooms = await getChatRoomsForUser(fastify, request.userId);

    addChatClient({
      socket: socket,
      roomIds: rooms.map((room) => room.id),
      userId: request.userId,
    });

    socket.on("message", async function (message) {
      fastify.log.trace("Received message: " + message);
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
