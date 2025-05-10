export type bracketTypeSettings =
  | "singleElimination"
  | "doubleElimination"
  | "roundRobin"
  | "swissRound";

export interface TournamentSettings {
  bracketType: bracketTypeSettings;
  matchWinner: string;
  players?: string[];
  playerCount?: number;
  gameData: {
    playerCount: number;
  };
  initialSeedingMethod?: string;
}
