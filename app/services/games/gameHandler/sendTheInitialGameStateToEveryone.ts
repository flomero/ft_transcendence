import GameManager from "./GameManager";

const sendTheInitialGameStateToEveryone = (gameManager: GameManager) => {
  const gameState = gameManager.getStateSnapshot();
  const playerIdReferenceTableLength = Array(gameManager.getPlayerSize()).fill(
    -1,
  );
  gameManager.sendMessageToAll(
    "gameState",
    gameState,
    playerIdReferenceTableLength,
  );
};

export default sendTheInitialGameStateToEveryone;
