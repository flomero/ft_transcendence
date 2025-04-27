import fp from "fastify-plugin";
import { getChatRoomsForUserView } from "../services/chat/room";
import type { ChatRoom } from "../services/database/chat/room";
import { isIgnoreAuthUrl } from "./auth";

declare module "fastify" {
  interface FastifyReply {
    locals: {
      rooms: ChatRoom[];
    };
  }
}

export default fp(async (fastify) => {
  fastify.addHook("preHandler", async (request, reply) => {
    if (!request.isAuthenticated) return;
    if (request.isAjax()) return;
    if (isIgnoreAuthUrl(request.url)) return;

    const rooms = await getChatRoomsForUserView(fastify, request.userId);
    reply.locals = {
      rooms: rooms,
    };
  });
});
