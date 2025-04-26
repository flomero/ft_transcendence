import S from "fluent-json-schema";
import {
  TOURNAMENT_CONFIGS_REGISTRY,
  TournamentGameModes,
} from "../../../config";

const tournamentConfigs = S.enum(Object.keys(TOURNAMENT_CONFIGS_REGISTRY));
const gamemodeNames = S.enum(Object.values(TournamentGameModes));

const newTournamentParamsSchema = S.object()
  .prop("tournamentConfigName", tournamentConfigs.required())
  .prop("gameModeName", gamemodeNames.required())
  .prop("tournamentSize", S.number().required().minimum(2));

const newTournamentSchema = {
  params: newTournamentParamsSchema,
};

export default newTournamentSchema;
