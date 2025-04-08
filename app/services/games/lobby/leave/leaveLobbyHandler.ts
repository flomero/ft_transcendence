import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import { removeUserFromLobby } from "./removeUserFromLobby";
import closePossibleLobbySocketConnection from "./closePossibleLobbySocketConnection";
import isUserOwnerOfLobby from "../lobbyVaidation/isUserOwnerOfLobby";
import isUserLastMemberInLobby from "../lobbyVaidation/isUserLastMemberInLobby";
import removeLobby from "./removeLobby";

async function leaveLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  try {
    validConnectionCheck(userId, lobbyId);

    if (
      isUserOwnerOfLobby(userId, lobbyId) === false &&
      isUserLastMemberInLobby(userId, lobbyId) === false
    ) {
      closePossibleLobbySocketConnection(userId, lobbyId);
      removeUserFromLobby(userId, lobbyId);
    } else if (isUserOwnerOfLobby(userId, lobbyId) === true) {
      removeLobby(lobbyId);
    } else if (isUserLastMemberInLobby(userId, lobbyId) === true) {
      removeLobby(lobbyId);
    }

    return reply.send({ message: "You have left the lobby" });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
  }
}

export default leaveLobbyHandler;
