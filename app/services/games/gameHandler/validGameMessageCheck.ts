import Ajv from "ajv";
import gameMessageSchema from "../../../schemas/games/gameHandler/gameMessageSchema";

const ajv = new Ajv();
const validateGameMessage = ajv.compile(gameMessageSchema.valueOf());

const validGameMessageCheck = (message: string): void => {
  const messageObject = JSON.parse(message);
  if (validateGameMessage(messageObject) === false) {
    throw new Error("Invalid game message");
  }
};

export default validGameMessageCheck;
