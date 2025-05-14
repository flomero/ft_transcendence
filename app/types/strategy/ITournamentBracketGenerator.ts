import type { TournamentResults } from "../tournament/tournament";

export type GameResult = {
  [playerID: string]: number;
};

export type MatchResults = {
  [playerID: string]: number[];
};

export type Match = {
  gamesCount: number;
  winner: string;
  results: MatchResults;
};

export type Round = {
  [matchID: string]: Match;
};

export type TournamentRankings = {
  [playedID: string]: number;
};

export type TournamentBracket = {
  rounds: Round[]; // Complete bracket organized by rounds
  seeding: Map<string, string[]>; // Complete match seeding
};

// Bracket Generators will keep track internally of all the rounds
// Thus they only need the last round results to keep it up to date
export interface ITournamentBracketGenerator {
  nextRound(): Round;
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean;
  computeFinalRankings(
    allMatchesResults: TournamentResults,
  ): TournamentRankings;
  getCompleteBracket(): TournamentBracket;
  getEliminatedPlayers(): string[];
}
