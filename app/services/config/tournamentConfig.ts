import { TOURNAMENT_CONFIGS_REGISTRY } from "../../config";

export type TournamentConfigKey = keyof typeof TOURNAMENT_CONFIGS_REGISTRY;

export const tournamentConfigFromString = (
  tournamentConfigString: string,
): TournamentConfigKey | null => {
  const tournamentConfig = Object.keys(TOURNAMENT_CONFIGS_REGISTRY).find(
    (mode) => mode.toLowerCase() === tournamentConfigString.toLowerCase(),
  );
  if (tournamentConfig === undefined) return null;
  return tournamentConfig as TournamentConfigKey;
};
