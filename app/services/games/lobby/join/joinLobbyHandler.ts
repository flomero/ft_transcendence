import { FastifyRequest, FastifyReply } from "fastify";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import { isLobbyRegistered } from "../lobbyVaidation/isLobbyRegistered";
import addUserToExistingLobby from "./addUserToExistingLobby";
import isLobbyOpen from "./isLobbyOpen";

async function joinLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;

  if (isUserInAnyLobby(userId) === true) {
    reply.code(400).send({ message: "User is already in a lobby" });
    return;
  } else if (isLobbyRegistered(lobbyId) === false) {
    reply.code(400).send({ message: "Lobby does not exist" });
    return;
  } else if (isLobbyOpen(lobbyId) === false) {
    reply.code(400).send({ message: "Lobby is not open" });
    return;
  }
  try {
    addUserToExistingLobby(lobbyId, userId);
  } catch (error) {
    if (error instanceof Error) {
      reply.code(400).send({ message: error.message });
      return;
    }
  }

  reply.code(200).send({ message: "User is added to Lobby" });
}

export default joinLobbyHandler;
