import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import GameManager from "../gameHandler/GameManager";
import addGameToDatabase from "../lobby/start/addGameToDatabase";
import { GAMEMODE_REGISTRY } from "../../../config";
import { GameModeType } from "../../config/gameModes";
import { GameOrigin } from "../../../types/games/gameHandler/GameOrigin";
import { connectionTimeoutHandler } from "../gameHandler/connectionTimeoutHandler";
import { FastifyInstance } from "fastify";
import { GameStatus } from "../../../types/games/gameBaseState";

/**
 * Checks if any players are already in a running game
 */
const checkPlayersInRunningGames = (playerIds: string[]): string | null => {
  for (const [gameId, gameManager] of gameManagers.entries()) {
    if (gameManager.gameStatus() === GameStatus.FINISHED) continue;

    const gamePlayers = gameManager.getPlayersAsArray();
    const gamePlayerIds = gamePlayers.map((player) => player.playerUUID);

    for (const playerId of playerIds) {
      if (gamePlayerIds.includes(playerId)) {
        return gameId;
      }
    }
  }
  return null;
};

/**
 * Creates a match based on the specified game mode and player ids
 */
export const createMatch = async (
  playerIds: string[],
  gameMode: GameModeType,
  fastify: FastifyInstance,
  gameOrigin?: GameOrigin,
  aiOpponentIds?: string[],
): Promise<string> => {
  const existingGameId = checkPlayersInRunningGames(playerIds);
  if (existingGameId) {
    throw new Error(
      `Cannot create match: Player already in active game ${existingGameId}`,
    );
  }

  const gameModeSettings = GAMEMODE_REGISTRY[
    gameMode as keyof typeof GAMEMODE_REGISTRY
  ] as GameSettings | undefined;
  if (!gameModeSettings) {
    throw new Error(`Game mode ${gameMode} not found in registry`);
  }

  const gameClass =
    GAME_REGISTRY[gameModeSettings.gameName].gameModes[
      gameModeSettings.gameModeName
    ].class;
  if (gameClass === null) throw new Error("Game class not found");
  const game = new gameClass(gameModeSettings);

  const gameManager = new GameManager(game, gameOrigin);

  playerIds.forEach((playerId) => {
    gameManager.addPlayer(playerId);
  });
  aiOpponentIds?.forEach((aiOpponentId) => {
    gameManager.addAiOpponent(aiOpponentId);
  });

  gameManagers.set(gameManager.getId(), gameManager);

  await addGameToDatabase(gameManager, fastify.sqlite, gameModeSettings);
  connectionTimeoutHandler(gameManager, fastify);
  return gameManager.getId();
};
