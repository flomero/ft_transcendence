import type GameManager from "./GameManager";
import { gameManagers } from "../lobby/start/startLobbyHandler";

const terminateGame = (game: GameManager) => {
  game.removeAllPlayers();
  gameManagers.delete(game.getId());
};

export default terminateGame;
