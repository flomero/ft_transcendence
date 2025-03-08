import { FastifyPluginAsync } from "fastify";
import { postMessage } from "../../services/chat/message";

interface ChatMessageResponse {
  html: string;
}

interface SocketClient {
  socket: any;
  roomId: number;
  userId: string;
}

const clients: SocketClient[] = [];

const chatWebSocket: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get("/ws", { websocket: true }, async function (socket, request) {
    fastify.log.trace("Chat client connected");

    const roomId = 1;
    clients.push({ socket: socket, roomId: roomId, userId: request.userId });

    socket.on("message", async function (message) {
      fastify.log.trace("Received message: " + message);

      for (const client of clients) {
        if (client.roomId == 1) {
          const html = await fastify.view("components/chat/message", {
            message: {
              userName: request.userName,
              message: message,
              timestamp: new Date().toLocaleString(),
              isOwnMessage: client.userId === request.userId,
            },
          });

          const response: ChatMessageResponse = {
            html: html,
          };

          client.socket.send(JSON.stringify(response));
        }
      }

      await postMessage(fastify, 1, request.userId, message.toString());
    });

    socket.on("close", async function () {
      fastify.log.trace("Chat client disconnected");

      const index = clients.findIndex((client) => client.socket === socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });

    socket.on("error", async function (error) {
      fastify.log.trace("Chat client error", error);

      const index = clients.findIndex((client) => client.socket === socket);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });
};

export default chatWebSocket;
