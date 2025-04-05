import { type GameResult } from "./ITournamentBracketGenerator";

export type MatchData = {
  playerIDs: string[];
  gamesCount: number;
  results: Record<string, number[]>;
  winCounts: Map<string, number>;
  winner: string;
  isComplete: boolean;
};

export interface ITournamentMatchWinner {
  /**
   * Initializes a new match with the specified games count
   * @param matchID Unique identifier for the match
   * @param playerIDs Array of player IDs participating in the match
   * @param gamesCount Total number of games to play in this match
   */
  initializeMatch(
    matchID: string,
    playerIDs: string[],
    gamesCount: number,
  ): void;

  /**
   * Records a game result for a match
   * @param matchID ID of the match
   * @param gameResult The result mapping players to positions
   * @returns boolean indicating if the match is now complete
   */
  recordGameResult(matchID: string, gameResult: GameResult): boolean;

  /**
   * Gets the current winner of a match (empty string if no winner yet)
   * @param matchID ID of the match
   * @returns PlayerID of the winner, or empty string if no winner yet
   */
  getMatchWinner(matchID: string): string;

  /**
   * Gets all results for a specific match
   * @param matchID ID of the match
   * @returns Object mapping player IDs to arrays of their positions in each game
   */
  getMatchResults(matchID: string): Record<string, number[]>;

  /**
   * Gets all matches
   */
  getMatches(): Map<string, MatchData>;

  /**
   * Determines if a match is complete
   * @param matchID ID of the match to check
   * @returns boolean indicating if the match is complete
   */
  isMatchComplete(matchID: string): boolean;
}
