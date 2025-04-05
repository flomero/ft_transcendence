import Ajv from "ajv";
import gameSocketSchema from "../../../schemas/games/gameHandler/gameWebsocketSchema";

const ajv = new Ajv();
const validateGameMessage = ajv.compile(gameSocketSchema.valueOf());

const validGameMessageCheck = (message: string): void => {
  const messageObject = JSON.parse(message);
  if (validateGameMessage(messageObject) === false) {
    throw new Error("Invalid game message");
  }
};

export default validGameMessageCheck;
