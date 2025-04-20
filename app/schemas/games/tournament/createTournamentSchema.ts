import S from "fluent-json-schema";

const bracketTypeEnum = S.enum([
  "singleElimination",
  "doubleElimination",
  "roundRobin",
  "swissRound",
]);

const gameDataSchema = S.object()
  .prop("gameName", S.string().required())
  .prop("gameModeName", S.string().required())
  .prop("playerCount", S.number().minimum(2).maximum(16).required())
  .prop("modifierNames", S.object().required())
  .prop("powerUpNames", S.object().required())
  .prop("gameModeConfig", S.object().required());

const createTournamentBodySchema = S.object()
  .prop("name", S.string().required())
  .prop("bracketType", bracketTypeEnum.required())
  .prop("matchWinnerType", S.enum(["bestOfX"]).required())
  .prop("initialSeedingMethod", S.enum(["random"]).required())
  .prop("gameData", gameDataSchema);

const createTournamentSchema = {
  body: createTournamentBodySchema,
};

export default createTournamentSchema;
