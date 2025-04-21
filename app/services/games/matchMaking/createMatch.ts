import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import GameManager from "../gameHandler/GameManager";
import type { Database } from "sqlite";
import addGameToDatabase from "../lobby/start/addGameToDatabase";
import { GAMEMODE_REGISTRY } from "../../../config";

/**
 * Creates a match based on the specified game mode and player ids
 */
export const createMatch = async (
  playerIds: string[],
  gameMode: string,
  db: Database,
): Promise<string> => {
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

  const gameManager = new GameManager(game);

  playerIds.forEach((playerId) => {
    gameManager.addPlayer(playerId);
  });

  gameManagers.set(gameManager.getId, gameManager);

  await addGameToDatabase(gameManager, db, gameModeSettings);

  return gameManager.getId;
};
