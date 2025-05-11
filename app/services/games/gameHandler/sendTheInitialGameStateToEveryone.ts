import GameManager from "./GameManager";

const sendTheInitialGameStateToEveryone = (gameManager: GameManager) => {
  const gameState = gameManager.getStateSnapshot();
  const referenceTable = gameManager.getReferenceTable();
  gameManager.sendMessageToAll({
    type: "gameState",
    data: gameState,
    referenceTable,
  });
};

export default sendTheInitialGameStateToEveryone;
