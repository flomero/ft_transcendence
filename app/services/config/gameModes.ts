import {
  MatchmakingGameModes,
  TournamentGameModes,
  LobbyGameModes,
} from "../../config";

export const gameModeFromString = (
  gameModeString: string,
): MatchmakingGameModes | null => {
  const gameMode = Object.values(MatchmakingGameModes).find(
    (mode) => mode.toLowerCase() === gameModeString.toLowerCase(),
  );
  if (gameMode === undefined) return null;
  return gameMode as MatchmakingGameModes;
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
