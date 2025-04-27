import S from "fluent-json-schema";
import { pongUserInputs } from "../../../types/games/userInput";

const optionsSchema = S.object()
  .prop("type", S.string().enum(Object.values(pongUserInputs)).required())
  .prop("timestamp", S.number().minimum(1712074823456).required());

const gameMessageSchema = S.object()
  .prop("type", S.string().enum(["userInput"]).required())
  .prop("options", optionsSchema)
  .required();

export default gameMessageSchema;
