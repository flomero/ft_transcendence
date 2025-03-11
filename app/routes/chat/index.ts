import type { FastifyPluginAsync } from "fastify";
import chatWebSocket from "./websocket";
import { getChatMessagesForRoom } from "../../services/chat/message";
import { getChatRoomsForUserView } from "../../services/chat/room";
import { sendMessage, setCurrentRoomId } from "../../services/chat/live";
import { userIsInRoom } from "../../services/database/chat/room";

const chat: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/", async (request, reply) => {
    const rooms = await getChatRoomsForUserView(fastify, request.userId);

    const data = {
      rooms: rooms,
    };
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/chat", data, viewOptions);
  });

  fastify.get("/:roomId", async (request, reply) => {
    const { roomId } = request.params as { roomId: number };
    if (!roomId) {
      return reply.status(400).send({ error: "Room ID is required" });
    }

    if (!(await userIsInRoom(fastify, roomId, request.userId))) {
      return reply.status(403).send({ error: "You are not in this room" });
    }

    await setCurrentRoomId(fastify, request.userId, roomId);

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

  fastify.post("/:roomId", async (request, reply) => {
    const { roomId } = request.params as { roomId: number };
    if (!roomId) {
      return reply.status(400).send({ error: "Room ID is required" });
    }

    const message = request.body as string;
    if (!message) {
      return reply.status(400).send({ error: "Message is required" });
    }

    if (!(await userIsInRoom(fastify, roomId, request.userId))) {
      return reply.status(403).send({ error: "You are not in this room" });
    }

    await sendMessage(fastify, request, message, roomId);
    // await addRoom(fastify, "Room " + roomId, [request.userId]);

    return reply.status(200).send({ message: "Message sent" });
  });

  fastify.register(chatWebSocket);
};

export default chat;
