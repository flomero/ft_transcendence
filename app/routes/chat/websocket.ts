import type { FastifyPluginAsync } from "fastify";
import { addChatClient, removeChatClient } from "../../services/chat/live";
import { getChatRoomsForUser } from "../../services/database/chat/room";

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/ws", { websocket: true }, async (socket, request) => {
    fastify.log.trace("Chat client connected");

    const rooms = await getChatRoomsForUser(fastify, request.userId);

    addChatClient({
      socket: socket,
      roomIds: rooms.map((room) => room.id),
      userId: request.userId,
      currentRoomId: -1,
    });

    socket.on("message", async (message) => {
      fastify.log.trace(`Received message: ${message}`);
    });

    socket.on("close", async () => {
      fastify.log.trace("Chat client disconnected");
      removeChatClient(request.userId);
    });

    socket.on("error", async (error) => {
      fastify.log.trace("Chat client error", error);
      removeChatClient(request.userId);
    });
  });
};

export default chatWebSocket;
