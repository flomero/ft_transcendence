import { FastifyRequest, FastifyReply } from "fastify";
import { Lobby } from "../Lobby";
import NewLobbyRequestBody from "../../../../interfaces/games/lobby/NewLobbyRequestBody";
import { isUserInAnyLobby } from "../lobbyVaidation/isUserInAnyLobby";
import validateGameModifierCheck from "../lobbyVaidation/validateGameModifierCheck";
import { setLobby } from "./setLobby";

export const PublicLobbies = new Map<string, Lobby>();
export const PrivateLobbies = new Map<string, Lobby>();

function initializeSampleLobbies() {
  const sampleUserIds = ["103562899409920461542", "user456", "user789"];

  const lobbyConfigs: NewLobbyRequestBody[] = [
    {
      lobbyMode: "public",
      gameName: "pong",
      gameModeName: "classicPong",
      playerCount: 2,
      gameModeConfig: {
        ballSpeedWidthPercentS: 1.5,
        ballRadius: 10,
        paddleCoveragePercent: 20,
        paddleSpeedWidthPercentS: 1.2,
        powerUpRadius: 5,
        powerUpCapacities: {
          speedBoost: 3,
        },
      },
      modifierNames: {
        powerUpSpawner: {
          meanDelayS: 10,
          delaySpanS: 5,
        },
        timedGame: {
          durationS: 300,
        },
        scoredGame: {
          goalObjective: 5,
        },
        survivalGame: [],
        elimination: {
          threshold: 3,
        },
        arenaShrink: [],
      },
      powerUpNames: {
        speedBoost: {
          spawnWeight: 1,
          selfActivation: true,
          durationS: 5,
          totalRampUpStrength: 2,
          rampUpFrequencyS: 1,
        },
      },
    },
    {
      lobbyMode: "public",
      gameName: "pong",
      gameModeName: "multiplayerPong",
      playerCount: 4,
      gameModeConfig: {
        ballSpeedWidthPercentS: 2.0,
        ballRadius: 12,
        paddleCoveragePercent: 25,
        paddleSpeedWidthPercentS: 1.5,
        powerUpRadius: 6,
        powerUpCapacities: {
          speedBoost: 5,
        },
      },
      modifierNames: {
        powerUpSpawner: {
          meanDelayS: 8,
          delaySpanS: 4,
        },
        timedGame: {
          durationS: 600,
        },
        scoredGame: {
          goalObjective: 10,
        },
        survivalGame: [],
        elimination: {
          threshold: 5,
        },
        arenaShrink: [],
      },
      powerUpNames: {
        speedBoost: {
          spawnWeight: 2,
          selfActivation: false,
          durationS: 8,
          totalRampUpStrength: 3,
          rampUpFrequencyS: 2,
        },
      },
    },
    {
      lobbyMode: "public",
      gameName: "pong",
      gameModeName: "classicPong",
      playerCount: 2,
      gameModeConfig: {
        ballSpeedWidthPercentS: 1.2,
        ballRadius: 8,
        paddleCoveragePercent: 15,
        paddleSpeedWidthPercentS: 1.0,
        powerUpRadius: 4,
        powerUpCapacities: {
          speedBoost: 2,
        },
      },
      modifierNames: {
        powerUpSpawner: {
          meanDelayS: 12,
          delaySpanS: 6,
        },
        timedGame: {
          durationS: 180,
        },
        scoredGame: {
          goalObjective: 3,
        },
        survivalGame: [],
        elimination: {
          threshold: 2,
        },
        arenaShrink: [],
      },
      powerUpNames: {
        speedBoost: {
          spawnWeight: 1,
          selfActivation: true,
          durationS: 4,
          totalRampUpStrength: 1,
          rampUpFrequencyS: 0.5,
        },
      },
    },
  ];

  // Create and add sample lobbies
  lobbyConfigs.forEach((config, index) => {
    const lobby = new Lobby(config, sampleUserIds[index]);
    PublicLobbies.set(lobby.getLobbyId, lobby);
  });
}

if (process.env.NODE_ENV === "development") {
  console.log("Initializing sample lobbies...");
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
    validateGameModifierCheck(body);
    const lobby = new Lobby(body, request.userId);
    setLobby(lobby, body.lobbyMode);
    reply.send({ lobbyId: lobby.getLobbyId });
  } catch (error) {
    if (error instanceof Error) reply.code(400).send({ error: error.message });
  }
}

export default newLobbyHandler;
