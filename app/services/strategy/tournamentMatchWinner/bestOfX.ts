import type { ITournamentMatchWinner } from "../../../types/strategy/ITournamentMatchWinner";
import type { GameResult } from "../../../types/strategy/ITournamentBracketGenerator";
import type { MatchData } from "../../../types/strategy/ITournamentMatchWinner";

export class BestOfX implements ITournamentMatchWinner {
  name = "bestOfX";

  // Map of matchID to match data
  protected matches: Map<string, MatchData> = new Map();

  initializeMatch(
    matchID: string,
    playerIDs: string[],
    gamesCount: number,
  ): void {
    const results: Record<string, number[]> = {};
    playerIDs.forEach((playerID) => {
      results[playerID] = [];
    });

    const winCounts = new Map<string, number>();
    playerIDs.forEach((playerID) => {
      winCounts.set(playerID, 0);
    });

    this.matches.set(matchID, {
      playerIDs,
      gamesCount,
      results,
      winCounts,
      winner: "",
      isComplete: false,
    });
  }

  recordGameResult(matchID: string, gameResult: GameResult): boolean {
    const match = this.matches.get(matchID);
    if (!match) {
      console.error(`Match ${matchID} not found`);
      return false;
    }

    // Already completed match
    if (match.isComplete) {
      return true;
    }

    // Record positions for each player
    Object.entries(gameResult).forEach(([playerID, position]) => {
      match.results[playerID].push(position);
    });

    // Find the winner of this game (player with position 1)
    const gameWinner =
      Object.entries(gameResult).find(([_, position]) => position === 1)?.[0] ||
      "";

    // Update win counts for the game winner
    if (gameWinner) {
      const currentWins = (match.winCounts.get(gameWinner) || 0) + 1;
      match.winCounts.set(gameWinner, currentWins);

      // Check if we have a match winner (reached majority of wins needed)
      const requiredWins = Math.ceil(match.gamesCount / 2);
      if (currentWins >= requiredWins) {
        match.winner = gameWinner;
        match.isComplete = true;
        return true; // Match is complete
      }
    }

    // Check if we've played all games and still need a winner
    const firstPlayerID = match.playerIDs[0];
    const gamesPlayed = match.results[firstPlayerID].length;

    if (gamesPlayed >= match.gamesCount) {
      // Find player with most wins
      let maxWins = 0;
      let matchWinner = "";

      match.winCounts.forEach((wins, playerID) => {
        if (wins > maxWins) {
          maxWins = wins;
          matchWinner = playerID;
        }
      });

      match.winner = matchWinner;
      match.isComplete = true;
      return true; // Match is complete
    }

    return false; // Match is not complete yet
  }

  getMatches(): Map<string, MatchData> {
    return this.matches;
  }

  getMatchWinner(matchID: string): string {
    return this.matches.get(matchID)?.winner || "";
  }

  getMatchResults(matchID: string): Record<string, number[]> {
    return this.matches.get(matchID)?.results || {};
  }

  isMatchComplete(matchID: string): boolean {
    return this.matches.get(matchID)?.isComplete || false;
  }
}
