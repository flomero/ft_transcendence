import type { FastifyPluginAsync } from "fastify";
import { isFriend } from "../../../services/database/friend/friends";
import {
  sendGameInvite,
  sendGameInviteToUser,
} from "../../../services/chat/live";
import { userIsInRoom } from "../../../services/database/chat/room";
import { lobbyExists } from "../../../services/games/lobby/lobbyWebsocket/getLobby";

const inviteLobby: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post("/:lobbyId/invite/friend/:friendId", async (request, reply) => {
    const { friendId, lobbyId } = request.params as {
      friendId: string;
      lobbyId: string;
    };
    if (!friendId || !lobbyId) return reply.badRequest("No friendId");

    if (!(await isFriend(fastify, request.userId, friendId)))
      return reply.badRequest("Friend not found");
    if (!lobbyExists(lobbyId)) return reply.badRequest("Lobby not found");

    try {
      await sendGameInviteToUser(
        fastify,
        request,
        friendId,
        "/games/lobby/join/" + lobbyId,
      );
    } catch (error) {
      if (error instanceof Error) return reply.badRequest(error.message);
      return reply.badRequest("Error sending invite");
    }

    return reply.code(200).send({ message: "Successfully send invite" });
  });

  fastify.post("/:lobbyId/invite/room/:roomId", async (request, reply) => {
    const { lobbyId, roomId } = request.params as {
      roomId: number;
      lobbyId: string;
    };
    if (!lobbyId || !roomId) return reply.badRequest("No lobbyId or roomId");

    if (!(await userIsInRoom(fastify, roomId, request.userId)))
      return reply.badRequest("Room does not exist or you are not in it");
    if (!lobbyExists(lobbyId)) return reply.badRequest("Lobby not found");

    try {
      let message;
      if (lobbyId === "rr") {
        message = "https://tiny.cc/v8di001";
      } else {
        message = "/games/lobby/join/" + lobbyId;
      }
      await sendGameInvite(fastify, request, roomId, message);
    } catch (error) {
      if (error instanceof Error) return reply.badRequest(error.message);
      return reply.badRequest("Error sending invite");
    }

    return reply.code(200).send({ message: "Successfully send invite" });
  });
};

export default inviteLobby;
