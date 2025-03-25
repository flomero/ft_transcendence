import { FastifyRequest, FastifyReply } from "fastify";
import { Lobby } from "../Lobby";
import NewLobbyRequestBody from "../../../../interfaces/games/lobby/NewLobbyRequestBody";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import validateGameModifierCheck from "../lobbyVaidation/validateGameModifierCheck";
import { setLobby } from "./setLobby";

export const PublicLobbies = new Map<string, Lobby>();
export const PrivateLobbies = new Map<string, Lobby>();

async function newLobbyHandler(
  request: FastifyRequest<{ Body: NewLobbyRequestBody }>,
  reply: FastifyReply,
) {
  const body = request.body;
  try {
    if (isUserInAnyLobby(request.userId) === true)
      throw new Error("User is already in a lobby");
    validateGameModifierCheck(body);
    const lobby = new Lobby(body, request.userId);
    setLobby(lobby, body.lobbyMode);
    reply.send({ lobbyId: lobby.getLobbyId });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
  }
}

export default newLobbyHandler;
