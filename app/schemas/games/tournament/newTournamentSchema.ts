import S from "fluent-json-schema";
import { gameSettingsSchema } from "../lobby/newLobbySchema";

const bracketTypeEnum = S.enum([
  "singleElimination",
  "doubleElimination",
  "roundRobin",
  "swissRound",
]);

const newTournamentBodySchema = S.object()
  .prop("bracketType", bracketTypeEnum.required())
  .prop("matchWinnerType", S.enum(["bestOfX"]).required())
  .prop("initialSeedingMethod", S.enum(["random"]).required())
  .prop("gameData", gameSettingsSchema.required());

const newTournamentSchema = {
  body: newTournamentBodySchema,
};

export default newTournamentSchema;
