import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { GameManagers } from "../lobby/start/startLobbyHandler";
import GameManager from "../gameHandler/GameManager";

const createVanillaMatch = (userIdOne: string, userIdTwo: string): string => {
  const settings = getVanillaGameSettings();
  const gameClass =
    GAME_REGISTRY[settings.gameName].gameModes[settings.gameModeName].class;

  if (gameClass === null) throw new Error("Game class not found");
  const gameManager = new GameManager(gameClass);

  gameManager.addPlayer(userIdOne);
  gameManager.addPlayer(userIdTwo);

  GameManagers.set(gameManager.getId, gameManager);
  return gameManager.getId;
};

const getVanillaGameSettings = (): GameSettings => {
  const gameSettings: GameSettings = {
    gameName: "pong",
    gameModeName: "classicPong",
    playerCount: 2,
    gameModeConfig: {},
  };
  return gameSettings;
};

export { createVanillaMatch };
