import { GameBase } from "../../gameBase";
import { GAME_REGISTRY } from "../../../../types/games/gameRegistry";
import { GameSettings } from "../../../../interfaces/games/lobby/GameSettings";
import { getActiveLobby } from "../lobbyWebsocket/getActiveLobby";

function createNewGameClass(lobbyId: string): GameBase {
  try {
    const settings = getGameSettings(lobbyId);
    const gameClass =
      GAME_REGISTRY[settings.gameName].gameModes[settings.gameMode].class;
    if (gameClass === null) throw new Error("Game class not found");
    return new gameClass(settings);
  } catch (err) {
    throw new Error("HERE: " + err);
  }
}

function getGameSettings(lobbyId: string): GameSettings {
  const lobby = getActiveLobby(lobbyId);
  return lobby.gameSettings;
}

export { createNewGameClass };
