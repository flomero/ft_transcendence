import S from "fluent-json-schema";

const optionsSchema = S.object()
  .prop("type", S.string().enum(["UP", "DOWN"]).required())
  .prop("timestamp", S.number().minimum(1712074823456).required());

const gameSocketSchema = S.object()
  .prop("type", S.string().enum(["userInput"]).required())
  .prop("options", optionsSchema)
  .required();

export default gameSocketSchema;
