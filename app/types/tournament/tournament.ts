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

export interface Match {
  id?: string; // Assigned dynamically
  name?: string; // Optional name for the match
  players: Player[];
}

export interface Round {
  name: string;
  matches: Match[];
}

export type Edge = [string, string] | [string, string, number];
