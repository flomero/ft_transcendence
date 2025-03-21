import { FastifyRequest, FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import setLobbyStateToStart from "./setLobbyStateToStart";
import areAllMembersReady from "../lobbyVaidation/areAllMembersReady";
import gameManagerCreate from "./gameManagerCreate";
import GameManager from "../../gameHandler/GameManager";

export const GameManagers = new Map<string, GameManager>();

async function startLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const lobbyId = request.params.lobbyId;
  const userId = request.userId;

  try {
    validConnectionCheck(userId, lobbyId);
    areAllMembersReady(lobbyId);
    setLobbyStateToStart(lobbyId, userId);
    const newGameManager = gameManagerCreate(lobbyId);
    GameManagers.set(newGameManager.id, newGameManager);
    reply.code(200).send({ message: "Lobby started: " + newGameManager.id });
  } catch (error) {
    if (error instanceof Error)
      reply.code(400).send({ message: error.message });
  }
}

export default startLobbyHandler;
