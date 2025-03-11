import { FastifyRequest, FastifyReply } from "fastify";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import { PublicLobbies } from "../new/newLobbyHandler";

async function joinLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const userId = request.userId;
  const lobbyId = request.params.lobbyId;
  console.log("lonbyId", lobbyId);

  if (isUserInAnyLobby(userId) === true) {
    reply.code(400).send({ message: "User is already in a lobby" });
    return;
  } else if (PublicLobbies.has(lobbyId) === false) {
    reply.code(400).send({ message: "Lobby does not exist" });
    return;
  }
  PublicLobbies.get(lobbyId)?.addMember(userId);
  reply.code(200).send({ message: "User is added to Lobby" });
}

export default joinLobbyHandler;
