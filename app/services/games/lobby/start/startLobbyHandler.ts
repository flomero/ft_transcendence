import { type FastifyRequest, type FastifyReply } from "fastify";
import { validConnectionCheck } from "../lobbyVaidation/validConnectionCheck";
import setLobbyStateToStart from "./setLobbyStateToStart";
import gameManagerCreate from "./gameManagerCreate";
import type GameManager from "../../gameHandler/GameManager";
import addGameToDatabase from "./addGameToDatabase";
import { getLobby } from "../lobbyWebsocket/getLobby";
import { canLobbyBeStartedCheck } from "./canLobbyBeStartedCheck";
import connectionTimeoutHandler from "../../gameHandler/connectionTimeoutHandler";

export const gameManagers = new Map<string, GameManager>();

async function startLobbyHandler(
  request: FastifyRequest<{ Params: { lobbyId: string } }>,
  reply: FastifyReply,
) {
  const lobbyId = request.params.lobbyId;
  const userId = request.userId;
  const lobby = getLobby(lobbyId);

  try {
    validConnectionCheck(userId, lobbyId);
    canLobbyBeStartedCheck(lobbyId);
    setLobbyStateToStart(userId, lobbyId);

    const newGameManager = gameManagerCreate(lobbyId);
    const fastify = request.server;

    gameManagers.set(newGameManager.getId(), newGameManager);
    await addGameToDatabase(
      newGameManager,
      request.server.sqlite,
      lobby.getGameSettings,
    );
    lobby.sendMessageToAllMembers(
      JSON.stringify({ type: "gameStarted", data: newGameManager.getId() }),
    );
    request.server.customMetrics.countGameStarted();
    lobby.disconnectAllMembers();
    connectionTimeoutHandler(newGameManager, fastify);
    return reply.code(200).send({ gameId: newGameManager.getId() });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.badRequest("Error starting lobby");
  }
}

export default startLobbyHandler;
