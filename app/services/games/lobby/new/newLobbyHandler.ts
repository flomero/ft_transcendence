import type { FastifyRequest, FastifyReply } from "fastify";
import { Lobby } from "../Lobby";
import type NewLobbyRequestBody from "../../../../interfaces/games/lobby/NewLobbyRequestBody";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import { setLobby } from "./setLobby";
import { GAMEMODE_REGISTRY } from "../../../../config";
import type { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";
import { fastifyInstance } from "../../../../app";

export const PublicLobbies = new Map<string, Lobby>();
export const PrivateLobbies = new Map<string, Lobby>();

function initializeSampleLobbies() {
  const sampleUserIds = Array.from<string>({
    length: Object.values(GAMEMODE_REGISTRY).length,
  }).fill("user123");
  sampleUserIds[0] = "107576203838928819270";

  const lobbyConfigs: NewLobbyRequestBody[] = Object.values(GAMEMODE_REGISTRY)
    .filter((_, index) => index < sampleUserIds.length)
    .map((gamemodeSettings: GameSettings) => {
      return {
        lobbyMode: "public",
        ...gamemodeSettings,
      };
    });

  // Create and add sample lobbies
  lobbyConfigs.forEach((config, index) => {
    const lobby = new Lobby(config, sampleUserIds[index]);
    PublicLobbies.set(lobby.getLobbyId, lobby);
  });
}

if (process.env.NODE_ENV === "testlobby") {
  fastifyInstance.log.debug("Initializing sample lobbies...");
  initializeSampleLobbies();
}

async function newLobbyHandler(
  request: FastifyRequest<{ Body: NewLobbyRequestBody }>,
  reply: FastifyReply,
) {
  const body = request.body;
  try {
    if (isUserInAnyLobby(request.userId) !== null)
      throw new Error("User is already in a lobby");
    const lobby = new Lobby(body, request.userId);
    setLobby(lobby, body.lobbyMode);
    reply.send({ lobbyId: lobby.getLobbyId });
  } catch (error) {
    if (error instanceof Error) return reply.badRequest(error.message);
    return reply.badRequest("Error creating lobby");
  }
}

export default newLobbyHandler;
