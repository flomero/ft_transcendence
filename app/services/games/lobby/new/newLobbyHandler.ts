import { FastifyRequest, FastifyReply } from "fastify";
import { Lobby } from "../Lobby";
import { NewLobbyRequestBody } from "../../../../interfaces/games/lobby/NewLobbyRequestBody";

export const PublicLobbies = new Map<string, Lobby>;
export const PrivateLobbies = new Map<string, Lobby>;

async function newLobbyHandler(
  request: FastifyRequest <{ Body: NewLobbyRequestBody }>,
  reply: FastifyReply)
  {
  const body = request.body;
  const lobby = new Lobby(body.gameName, body.gameModeName, request.userId)
  //const lobby = new Lobby(body.gameName, body.gameModeName, "1234") // for testing
  if (request.body.lobbyMode === "public") {
    PublicLobbies.set(lobby.getLobbyId, lobby);
  }
  else if (request.body.lobbyMode === "private") {
    PrivateLobbies.set(lobby.getLobbyId, lobby);
  }
  reply.send({ lobbyId: lobby.getLobbyId });
}

export default newLobbyHandler;
