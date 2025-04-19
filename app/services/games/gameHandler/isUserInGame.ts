import { gameManagers } from "../lobby/start/startLobbyHandler";

const isUserInGame = (userId: string): string | null => {
  for (const [gameId, gameManager] of gameManagers) {
    if (gameManager.hasPlayer(userId)) {
      return gameId;
    }
  }
  return null;
};

export default isUserInGame;
