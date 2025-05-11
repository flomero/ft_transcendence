import type { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { removeUserFromLobby } from "./removeUserFromLobby";
import closePossibleLobbySocketConnection from "./closePossibleLobbySocketConnection";
import isUserOwnerOfLobby from "../lobbyVaidation/isUserOwnerOfLobby";
import isUserLastMemberInLobby from "../lobbyVaidation/isUserLastMemberInLobby";
import removeLobby from "./removeLobby";
import { getLobby } from "../lobbyWebsocket/getLobby";

async function leaveLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId);

    removeMemberFromLobby(lobbyId, userId);
    return reply.send({ message: "You have left the lobby" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export const removeMemberFromLobby = (lobbyId: string, userId: string) => {
  const lobby = getLobby(lobbyId);

  if (
    isUserOwnerOfLobby(userId, lobbyId) === false &&
    isUserLastMemberInLobby(userId, lobbyId) === false
  ) {
    closePossibleLobbySocketConnection(userId, lobbyId);
    removeUserFromLobby(userId, lobbyId);
  } else if (isUserOwnerOfLobby(userId, lobbyId) === true) {
    lobby.disconnectAllMembers();
    removeLobby(lobbyId);
  } else if (isUserLastMemberInLobby(userId, lobbyId) === true) {
    lobby.disconnectAllMembers();
    removeLobby(lobbyId);
  }
};

export default leaveLobbyHandler;
