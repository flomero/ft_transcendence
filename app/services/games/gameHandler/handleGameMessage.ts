import { gameManagers } from "../lobby/start/startLobbyHandler";
import validGameMessageCheck from "./validGameMessageCheck";
import type { GameMessage } from "../../../types/games/userInput";

const handleGameMessage = (
  message: string,
  userId: string,
  gameManagerId: string,
) => {
  const gameManager = gameManagers.get(gameManagerId);
  if (gameManager === undefined) return;
  const player = gameManager.getPlayer(userId);
  if (player === undefined) return;
  try {
    validGameMessageCheck(message);
    const messageObj: GameMessage = JSON.parse(message);

    switch (messageObj.type) {
      case "userInput":
        messageObj.options.playerId = player.id;
        gameManager.handleAction(messageObj);
        break;

      default:
        throw new Error("Invalid message type");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      gameManager.sendMessageToPlayer(userId, "error", error.message);
    }
  }
};

export default handleGameMessage;
