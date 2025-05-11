import type { FastifyPluginAsync } from "fastify";
import { isFriend } from "../../../services/database/friend/friends";
import {
  sendGameInvite,
  sendGameInviteToUser,
} from "../../../services/chat/live";
import { userIsInRoom } from "../../../services/database/chat/room";
import { tournaments } from "../../../services/games/tournament/tournaments";

const inviteTournament: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post(
    "/:tournamentId/invite/friend/:friendId",
    async (request, reply) => {
      const { friendId, tournamentId } = request.params as {
        friendId: string;
        tournamentId: string;
      };
      if (!friendId || !tournamentId) return reply.badRequest("No friendId");

      if (!(await isFriend(fastify, request.userId, friendId)))
        return reply.badRequest("Friend not found");

      if (!tournaments.has(tournamentId))
        return reply.badRequest("Tournament not found");

      try {
        await sendGameInviteToUser(
          fastify,
          request,
          friendId,
          "/games/tournament/join/" + tournamentId,
        );
      } catch (error) {
        if (error instanceof Error) return reply.badRequest(error.message);
        return reply.badRequest("Error sending invite");
      }

      return reply.code(200).send({ message: "Successfully send invite" });
    },
  );

  fastify.post("/:tournamentId/invite/room/:roomId", async (request, reply) => {
    const { tournamentId, roomId } = request.params as {
      roomId: number;
      tournamentId: string;
    };
    if (!tournamentId || !roomId)
      return reply.badRequest("No tournamentId or roomId");

    if (!(await userIsInRoom(fastify, roomId, request.userId)))
      return reply.badRequest("Room does not exist or you are not in it");
    if (!tournaments.has(tournamentId))
      return reply.badRequest("Tournament not found");

    try {
      let message;
      if (tournamentId === "rr") {
        message = "https://tiny.cc/v8di001";
      } else {
        message = "/games/tournament/join/" + tournamentId;
      }
      await sendGameInvite(fastify, request, roomId, message);
    } catch (error) {
      if (error instanceof Error) return reply.badRequest(error.message);
      return reply.badRequest("Error sending invite");
    }

    return reply.code(200).send({ message: "Successfully send invite" });
  });
};

export default inviteTournament;
