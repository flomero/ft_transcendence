export type PlayerResults = {
  [matchID: string]: {
    won: boolean;
    results: number[];
  };
};

export type TournamentResults = {
  [playerID: string]: PlayerResults[];
};

export enum TournamentStatus {
  CREATED,
  ON_GOING,
  FINISHED,
}

export interface PlayerInfos {
  id: string;
  name?: string;
  isReady?: boolean;
  score: number[];
  winCount: number;
  results?: number[]; // Optional results for the player
}

export enum MatchStatus {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export interface MatchInfos {
  id?: string; // Assigned dynamically
  players: PlayerInfos[];
  gameWinners?: number[]; // PlayerIDs for each game of the player that won (no draws) -> same length as players.score
  leadPlayer?: number; // PlayerID of player in the lead -> -1 in case of tie
  currentGame?: number; // ID of the current game being played -> 0 by default (first game)
  status: MatchStatus;
  startTime?: string; // ISO date string for match start time
}

export interface RoundInfos {
  name?: string;
  matches: MatchInfos[];
  isCurrent?: boolean; // Optional flag to indicate if this is the current round
}

export interface TournamentInfos {
  id: string;
  state: TournamentStatus;
  playerCount: number;
  type: string; // e.g., "SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", etc.
  rounds: RoundInfos[];
  seeding?: Edge[];
}

/** ────────────────────────────────────────────────────────────────
 *  Edge   — [from-match] ➜ [to-match] (+ optional horizontal offset)
 *  Now carries the tournament id in position 0.
 * ────────────────────────────────────────────────────────────────*/
export type Edge =
  | [tournamentId: string, from: string, to: string]
  | [tournamentId: string, from: string, to: string, offset: number];
