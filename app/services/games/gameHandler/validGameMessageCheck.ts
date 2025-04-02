import Ajv, { ValidateFunction } from "ajv";
import gameSocketSchema from "../../../schemas/games/gameHandler/gameWebsocketSchema";
import GameMessage from "../../../interfaces/games/gameHandler/GameMessage";

const ajv = new Ajv();
const validateGameMessage: ValidateFunction<GameMessage> = ajv.compile(
  gameSocketSchema.raw,
);

const validGameMessageCheck = (message: string): void => {
  const messageObject = JSON.parse(message);
  if (validateGameMessage(messageObject) === false) {
    throw new Error("Invalid game message");
  }
};

export default validGameMessageCheck;
