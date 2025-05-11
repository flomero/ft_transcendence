export type BracketTypeSettings =
  | "singleElimination"
  | "doubleElimination"
  | "roundRobin"
  | "swissRound";

export interface TournamentSettings {
  bracketType: BracketTypeSettings;
  matchWinner: string;
  players?: string[];
  playerCount?: number;
  initialSeedingMethod?: string;
  gameData: {
    playerCount: number;
  };
  id: string; // Optional tournament ID
}
