import { gameManagers } from "../lobby/start/startLobbyHandler";

const gameValidationCheck = (userId: string, gameId: string) => {
  const gameManager = gameManagers.get(gameId);
  if (gameManager === undefined) {
    throw new Error("Game does not exist");
  } else if (gameManager.hasPlayer(userId) === false) {
    throw new Error("User not in game");
  }
};

export default gameValidationCheck;
