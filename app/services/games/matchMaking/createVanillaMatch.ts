import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import { GAME_REGISTRY } from "../../../types/games/gameRegistry";
import { gameManagers } from "../lobby/start/startLobbyHandler";
import GameManager from "../gameHandler/GameManager";
import type { Database } from "sqlite";
import type { GameBase } from "../gameBase";
import addGameToDatabase from "../lobby/start/addGameToDatabase";

const createVanillaMatch = (
  userIdOne: string,
  userIdTwo: string,
  db: Database,
): string => {
  const newGame = createVanillaNewGame();
  const newGameManager = createNewGameManager(newGame, userIdOne, userIdTwo);

  gameManagers.set(newGameManager.getId, newGameManager);

  addGameToDatabase(newGameManager, db, getVanillaGameSettings());
  return newGameManager.getId;
};

const createVanillaNewGame = (): GameBase => {
  const settings = getVanillaGameSettings();
  const gameClass =
    GAME_REGISTRY[settings.gameName].gameModes[settings.gameModeName].class;
  if (gameClass === null) throw new Error("Game class not found");
  const game = new gameClass(settings);
  return game;
};

const createNewGameManager = (
  game: GameBase,
  userIdOne: string,
  userIdTwo: string,
): GameManager => {
  const gameManager = new GameManager(game);

  gameManager.addPlayer(userIdOne);
  gameManager.addPlayer(userIdTwo);

  return gameManager;
};

const getVanillaGameSettings = (): GameSettings => {
  const gameSettings: GameSettings = {
    gameName: "pong",
    gameModeName: "classicPong",
    modifierNames: {},
    powerUpNames: {},
    playerCount: 2,
  };
  return gameSettings;
};

export { createVanillaMatch };
