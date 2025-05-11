import { gameManagers } from "../lobby/start/startLobbyHandler";

export const getGameOfPlayer = (userId: string) => {
  for (const manager of gameManagers.values()) {
    if (manager.hasPlayer(userId)) {
      return manager;
    }
  }
  throw new Error("User not in any game");
};
