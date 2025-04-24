import S from "fluent-json-schema";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  TournamentGameModes,
} from "../../../config";

const tournamentConfigs = S.enum(Object.keys(TOURNAMENT_CONFIGS_REGISTRY));
const gamemodeNames = S.enum(Object.values(TournamentGameModes));

const newTournamentBodySchema = S.object()
  .prop("tournamentConfigName", tournamentConfigs.required())
  .prop("gamemodeName", gamemodeNames.required());

const newTournamentSchema = {
  body: newTournamentBodySchema,
};

export default newTournamentSchema;
