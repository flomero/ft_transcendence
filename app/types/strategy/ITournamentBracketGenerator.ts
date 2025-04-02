import { TournamentResult } from "../../services/tournament/tournament";

export type PlayerResult = {
  id: string;
  result: number;
};

export type MatchResult = PlayerResult[];

export type RoundResult = MatchResult[];

export type MatchPlayers = string[];
export type RoundMatches = MatchPlayers[];

// Bracket Generators will keep track internally of all the rounds
// Thus they only need the last round results to keep it up to date
export interface ITournamentBracketGenerator {
  nextRound(lastRoundResults: RoundResult): RoundMatches;
  finalResults(): TournamentResult;
}
