import {
  GameResult,
  ITournamentBracketGenerator,
  Match,
  Round,
  TournamentRankings,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { TournamentResults } from "../../../types/tournament/tournament";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { RNG } from "../../games/rng";

type PlayerStats = {
  wins: number;
  losses: number;
  score: number;
  opponents: Set<string>; // Track played opponents
  eliminated: boolean;
  qualified: boolean;
  lastRoundPlayed: number;
};

export class SwissRound implements ITournamentBracketGenerator {
  name = "swissRound";

  protected tournamentData: Record<string, any>;
  protected roundCount: number;
  protected gamesCount: number;
  protected finalGamesCount: number;
  protected playersPerMatch: number;
  protected rng: RNG = new RNG();

  // Track current round
  protected currentRoundIndex: number = 0;

  // Store all players and their stats
  protected playerStats: Map<string, PlayerStats> = new Map();

  // Track active matches in current round
  protected activeMatches: Set<string> = new Set();

  // Store results for ranking computation
  protected matchResults: Map<string, Match> = new Map();

  // Store all rounds for final ranking
  protected allRounds: Round[] = [];

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;
    this.playersPerMatch = tournamentData.gameData.playerCount;

    this.roundCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].roundCount;
    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;
    this.finalGamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].finalGamesCount;

    // Initialize player stats
    this.initializePlayerStats();

    console.log(
      `Swiss Round Tournament initialized with ${this.tournamentData.players.length} players`,
    );
    console.log(
      `Round count: ${this.roundCount}, Games per match: ${this.gamesCount}, Final games: ${this.finalGamesCount}`,
    );
  }

  /**
   * Initialize player statistics
   */
  private initializePlayerStats(): void {
    for (const playerId of this.tournamentData.players) {
      this.playerStats.set(playerId, {
        wins: 0,
        losses: 0,
        score: 0,
        opponents: new Set<string>(),
        eliminated: false,
        qualified: false,
        lastRoundPlayed: 0,
      });
    }
  }

  // ----------  Bracket Generation  ---------- //

  /**
   * Generate the next round of matches
   */
  nextRound(): Round {
    // Clear active matches for the new round
    this.activeMatches.clear();

    // Check if all players are either qualified or eliminated
    if (this.isSwissTournamentComplete()) {
      console.log(
        "Tournament complete - all players are qualified or eliminated",
      );
      return {};
    }

    // Increment round index
    this.currentRoundIndex++;
    console.log(`Generating round ${this.currentRoundIndex}`);

    // Create new round
    const round: Round = {};

    // Get active players (not qualified, not eliminated)
    const activePlayers = this.getActivePlayers();
    console.log(
      `Active players for round ${this.currentRoundIndex}: ${activePlayers.length}`,
    );

    if (activePlayers.length === 0) {
      return {};
    }

    // Group players by win count
    const playersByWinCount = this.groupPlayersByWinCount(activePlayers);

    // Create matches within each win group
    let matchCounter = 0;

    // Process win groups in order (optional - could be useful for better pairings)
    const winCounts = Array.from(playersByWinCount.keys()).sort(
      (a, b) => a - b,
    );

    for (const winCount of winCounts) {
      const players = playersByWinCount.get(winCount) || [];
      console.log(`Win group ${winCount}: ${players.length} players`);

      // Skip if no active players in this group
      if (players.length === 0) continue;

      // Shuffle players for random pairings within the same win group
      let shuffledPlayers = this.shufflePlayers(players);

      // If we have an odd number of players and there are other win groups,
      // we might want to pair with adjacent win groups
      if (shuffledPlayers.length % this.playersPerMatch !== 0) {
        console.log(
          `Odd number of players (${shuffledPlayers.length}) in win group ${winCount}`,
        );

        // Try to find players from adjacent win groups if needed
        // This is a basic implementation - could be more sophisticated
        const adjacentPlayers = this.findAdjacentGroupPlayers(
          winCount,
          playersByWinCount,
        );
        if (adjacentPlayers.length > 0) {
          shuffledPlayers = [...shuffledPlayers, ...adjacentPlayers];
        }
      }

      // Create matches for this group
      while (shuffledPlayers.length >= this.playersPerMatch) {
        const matchPlayers: string[] = [];

        // Try to create valid matches where players haven't faced each other
        const validPlayersFound = this.findValidMatchPlayers(
          shuffledPlayers,
          matchPlayers,
        );

        // If we couldn't find valid players, just take the first ones
        if (!validPlayersFound) {
          for (let i = 0; i < this.playersPerMatch; i++) {
            if (shuffledPlayers.length > 0) {
              matchPlayers.push(shuffledPlayers.shift()!);
            }
          }
        }

        // If we have enough players for a match
        if (matchPlayers.length === this.playersPerMatch) {
          const matchID = `R${this.currentRoundIndex}_M${matchCounter}`;
          matchCounter++;

          // Determine if this is a qualification or elimination match for any player
          const isFinalMatch = matchPlayers.some((playerId) => {
            const stats = this.playerStats.get(playerId)!;
            return (
              stats.wins === this.roundCount - 1 ||
              stats.losses === this.roundCount - 1
            );
          });

          // Create results object for the match
          const results: Record<string, number[]> = {};
          matchPlayers.forEach((playerId) => {
            results[playerId] = [];
          });

          // Create the match
          round[matchID] = {
            gamesCount: isFinalMatch ? this.finalGamesCount : this.gamesCount,
            winner: "",
            results,
          };

          // Track the match as active
          this.activeMatches.add(matchID);

          // Update opponent records
          this.updateOpponentRecords(matchPlayers);

          console.log(
            `Created match ${matchID} with ${matchPlayers.length} players`,
          );
        }
      }

      // Handle remaining players (if any)
      if (
        shuffledPlayers.length > 0 &&
        shuffledPlayers.length < this.playersPerMatch
      ) {
        // These players get a bye (no match this round)
        shuffledPlayers.forEach((playerId) => {
          console.log(
            `Player ${playerId} gets a bye in round ${this.currentRoundIndex}`,
          );

          // Update stats for bye players
          const stats = this.playerStats.get(playerId)!;
          stats.lastRoundPlayed = this.currentRoundIndex;
        });
      }
    }

    // Store this round
    this.allRounds.push({ ...round });

    return round;
  }

  /**
   * Find players who haven't played against each other
   */
  private findValidMatchPlayers(
    availablePlayers: string[],
    matchPlayers: string[],
  ): boolean {
    if (this.currentRoundIndex <= 1) {
      // In the first round, just take the first players
      for (let i = 0; i < this.playersPerMatch; i++) {
        if (availablePlayers.length > 0) {
          matchPlayers.push(availablePlayers.shift()!);
        }
      }
      return true;
    }

    // For later rounds, try to find players who haven't played each other
    for (let i = 0; i < this.playersPerMatch; i++) {
      if (i === 0) {
        // First player can be anyone
        matchPlayers.push(availablePlayers.shift()!);
      } else {
        // For subsequent players, find one who hasn't played against all current match players
        let validPlayerFound = false;

        for (let j = 0; j < availablePlayers.length; j++) {
          const candidatePlayer = availablePlayers[j];
          const candidateStats = this.playerStats.get(candidatePlayer)!;

          // Check if this player has played against any current match players
          let hasPlayedAgainstAny = false;
          for (const existingPlayer of matchPlayers) {
            if (candidateStats.opponents.has(existingPlayer)) {
              hasPlayedAgainstAny = true;
              break;
            }
          }

          if (!hasPlayedAgainstAny) {
            // Found a valid player
            matchPlayers.push(candidatePlayer);
            availablePlayers.splice(j, 1);
            validPlayerFound = true;
            break;
          }
        }

        if (!validPlayerFound) {
          // If no valid player found, return false
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Find players from adjacent win groups for pairing
   */
  private findAdjacentGroupPlayers(
    winCount: number,
    playersByWinCount: Map<number, string[]>,
  ): string[] {
    // Try one win count higher, then one lower
    const higherWinCount = winCount + 1;
    const lowerWinCount = winCount - 1;

    // Check higher win count first
    if (playersByWinCount.has(higherWinCount)) {
      const players = playersByWinCount.get(higherWinCount)!;
      if (players.length > 0) {
        const selectedPlayer = players.shift()!;
        console.log(
          `Selected player ${selectedPlayer} from higher win group ${higherWinCount}`,
        );
        return [selectedPlayer];
      }
    }

    // Then check lower win count
    if (playersByWinCount.has(lowerWinCount)) {
      const players = playersByWinCount.get(lowerWinCount)!;
      if (players.length > 0) {
        const selectedPlayer = players.shift()!;
        console.log(
          `Selected player ${selectedPlayer} from lower win group ${lowerWinCount}`,
        );
        return [selectedPlayer];
      }
    }

    return [];
  }

  /**
   * Get a list of active players (not qualified or eliminated)
   */
  private getActivePlayers(): string[] {
    const activePlayers: string[] = [];

    for (const [playerId, stats] of this.playerStats.entries()) {
      if (!stats.qualified && !stats.eliminated) {
        activePlayers.push(playerId);
      }
    }

    return activePlayers;
  }

  /**
   * Update the opponent records for all players in a match
   */
  private updateOpponentRecords(players: string[]): void {
    for (let i = 0; i < players.length; i++) {
      const playerStats = this.playerStats.get(players[i])!;

      // Add all other players as opponents
      for (let j = 0; j < players.length; j++) {
        if (i !== j) {
          playerStats.opponents.add(players[j]);
        }
      }
    }
  }

  /**
   * Group players by their win count
   */
  private groupPlayersByWinCount(
    activePlayers: string[],
  ): Map<number, string[]> {
    const playersByWins = new Map<number, string[]>();

    for (const playerId of activePlayers) {
      const stats = this.playerStats.get(playerId)!;
      const winCount = stats.wins;

      if (!playersByWins.has(winCount)) {
        playersByWins.set(winCount, []);
      }

      playersByWins.get(winCount)!.push(playerId);
    }

    return playersByWins;
  }

  /**
   * Shuffle players for random pairing
   */
  private shufflePlayers(players: string[]): string[] {
    const shuffled = [...players];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Check if Swiss tournament is complete (all players eliminated or qualified)
   */
  private isSwissTournamentComplete(): boolean {
    for (const [_, stats] of this.playerStats.entries()) {
      if (!stats.eliminated && !stats.qualified) {
        return false;
      }
    }
    return true;
  }

  // ----------   Result Handling    ---------- //

  /**
   * Handle match completion notification
   */
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean {
    if (!this.activeMatches.has(matchID)) {
      console.error(`Match ${matchID} not found in active matches`);
      return false;
    }

    // Find the match in the current round
    const currentRound = this.allRounds[this.currentRoundIndex - 1];
    const match = currentRound[matchID];

    if (!match) {
      console.error(`Match ${matchID} not found in current round`);
      return false;
    }

    // Get the players in order of their performance (first place first)
    const rankedPlayers = Object.entries(gameResult)
      .sort((a, b) => a[1] - b[1])
      .map((entry) => entry[0]);

    // Store the match for final results
    this.matchResults.set(matchID, match);

    // Update player statistics
    this.updatePlayerStats(rankedPlayers, match);

    // Remove from active matches
    this.activeMatches.delete(matchID);

    return true;
  }

  /**
   * Update player statistics based on match results
   */
  private updatePlayerStats(rankedPlayers: string[], match: Match): void {
    // First player is the winner
    // const winner = rankedPlayers[0];

    // Update each player's stats
    rankedPlayers.forEach((playerId, index) => {
      const isWinner = index === 0;
      const stats = this.playerStats.get(playerId)!;

      // Update last round played
      stats.lastRoundPlayed = this.currentRoundIndex;

      // Update wins/losses
      if (isWinner) {
        stats.wins++;
        console.log(
          `Player ${playerId} wins! Now has ${stats.wins}/${this.roundCount} wins`,
        );
      } else {
        stats.losses++;
        console.log(
          `Player ${playerId} loses. Now has ${stats.losses}/${this.roundCount} losses`,
        );
      }

      // Update total score from match results
      if (match.results[playerId]) {
        stats.score += match.results[playerId].reduce(
          (sum, score) => sum + score,
          0,
        );
      }

      // Check for qualification or elimination
      if (stats.wins >= this.roundCount) {
        stats.qualified = true;
        console.log(`Player ${playerId} has QUALIFIED with ${stats.wins} wins`);
      }

      if (stats.losses >= this.roundCount) {
        stats.eliminated = true;
        console.log(
          `Player ${playerId} has been ELIMINATED with ${stats.losses} losses`,
        );
      }
    });
  }

  // ---------- Ranking computation  ---------- //

  /**
   * Compute the final rankings for all players
   */
  computeFinalRankings(
    allMatchesResults: TournamentResults,
  ): TournamentRankings {
    const rankings: TournamentRankings = {};

    // Sort players by:
    // 1. Qualified status (qualified players rank higher)
    // 2. Number of wins
    // 3. Win/loss ratio
    // 4. Total score

    const playerRankingData: Array<[string, PlayerStats]> = [];

    for (const [playerId, stats] of this.playerStats.entries()) {
      playerRankingData.push([playerId, stats]);
    }

    playerRankingData.sort((a, b) => {
      const statsA = a[1];
      const statsB = b[1];

      // Qualified players rank higher
      if (statsA.qualified && !statsB.qualified) return -1;
      if (!statsA.qualified && statsB.qualified) return 1;

      // More wins rank higher
      if (statsA.wins !== statsB.wins) {
        return statsB.wins - statsA.wins;
      }

      // Fewer losses rank higher (if wins are the same)
      if (statsA.losses !== statsB.losses) {
        return statsA.losses - statsB.losses;
      }

      // Higher total score ranks higher
      return statsB.score - statsA.score;
    });

    // Assign rankings
    playerRankingData.forEach(([playerId, _], index) => {
      rankings[playerId] = index + 1;
    });

    return rankings;
  }

  /**
   * Helper method for the Tournament to check if a match is still active
   */
  isMatchActive(matchID: string): boolean {
    return this.activeMatches.has(matchID);
  }
}
