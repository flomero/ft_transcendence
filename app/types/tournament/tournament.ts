export type PlayerResults = {
  [matchID: string]: {
    won: boolean;
    results: number[];
  };
};

export type TournamentResults = {
  [playerID: string]: PlayerResults[];
};

export interface Player {
  id: string;
  name: string;
  score?: number; // Optional score for the player
  results?: number[]; // Optional results for the player
}

export enum MatchStatus {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export interface Match {
  id?: string; // Assigned dynamically
  name?: string; // Optional name for the match
  players: Player[];
  status: MatchStatus;
  startTime?: string; // ISO date string for match start time
  previousRoundInfo?: string; // Info about previous matches for NOT_STARTED matches
}

export interface Round {
  name: string;
  matches: Match[];
  isCurrent?: boolean; // Optional flag to indicate if this is the current round
}

export type Edge = [string, string] | [string, string, number];
