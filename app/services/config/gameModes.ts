import {
  MatchmakingGameModes,
  TournamentGameModes,
  LobbyGameModes,
} from "../../config";

export type GameModeType =
  | MatchmakingGameModes
  | LobbyGameModes
  | TournamentGameModes;
export type GameModeEnumType =
  | typeof MatchmakingGameModes
  | typeof LobbyGameModes
  | typeof TournamentGameModes;

export const gameModeFromString = (
  gameModeString: string,
  gameModeEnum: GameModeEnumType,
): GameModeType | null => {
  const gameMode = Object.values(gameModeEnum).find(
    (mode) => mode.toLowerCase() === gameModeString.toLowerCase(),
  );
  if (gameMode === undefined) return null;
  return gameMode as GameModeType;
};

export const getMatchmakingGameModes = (): MatchmakingGameModes[] => {
  return Object.values(MatchmakingGameModes);
};

export const getTournamentGameModes = (): TournamentGameModes[] => {
  return Object.values(TournamentGameModes);
};

export const getLobbyGameModes = (): LobbyGameModes[] => {
  return Object.values(LobbyGameModes);
};

export const gameModeArrToString = (
  gameMode: MatchmakingGameModes[] | TournamentGameModes[] | LobbyGameModes[],
): string[] => {
  return gameMode.map((mode) => mode.toString());
};
