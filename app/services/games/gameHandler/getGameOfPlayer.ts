import { gameManagers } from "../lobby/start/startLobbyHandler";

export const getGameOfPlayer = (userId: string) => {
  let gameManager;

  for (const manager of gameManagers.values()) {
    if (manager.hasPlayer(userId)) {
      return manager;
    }
  }
  if (!gameManager) {
    throw new Error("User not in any game");
  }
};
