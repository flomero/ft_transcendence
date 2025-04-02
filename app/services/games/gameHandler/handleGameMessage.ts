import { gameManagers } from "../lobby/start/startLobbyHandler";
import validGameMessageCheck from "./validGameMessageCheck";
import GameMessage from "../../../interfaces/games/gameHandler/GameMessage";

const handleGameMessage = (
  message: string,
  userId: string,
  gameManagerId: string,
) => {
  const gameManager = gameManagers.get(gameManagerId);
  const player = gameManager!.getPlayer(userId);
  try {
    validGameMessageCheck(message);
    const messageObj: GameMessage = JSON.parse(message);

    switch (messageObj.type) {
      case "userInput":
        messageObj.options.playerId = player!.id;
        gameManager!.handleAction(messageObj);
        break;

      default:
        throw new Error("Invalid message type");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      gameManager!.sendMessageToPlayer(userId, "error", error.message);
    }
  }
};

export default handleGameMessage;
