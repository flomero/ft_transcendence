import S from "fluent-json-schema";

const gameSocketSchema = S.object()
  .prop("type", S.string().enum(["userInput"]).required())
  .prop(
    "options",
    S.object()
      .prop("type", S.enum(["UP", "DOWN"]).required())
      .prop("playerId", S.string().minLength(36).maxLength(36).required())
      .prop("timestamp", S.number().minimum(1712074823456).required())
      .required(["type", "playerId", "timestamp"]),
  )
  .required(["type", "options"]);

export default gameSocketSchema;
