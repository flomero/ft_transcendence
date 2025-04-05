import { type TournamentResults } from "../../types/tournament/tournament";

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

// Bracket Generators will keep track internally of all the rounds
// Thus they only need the last round results to keep it up to date
export interface ITournamentBracketGenerator {
  nextRound(): Round;
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean;
  finalResults(): TournamentResults;
}
