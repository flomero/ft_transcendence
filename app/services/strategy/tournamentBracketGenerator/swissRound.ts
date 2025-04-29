import type {
  GameResult,
  ITournamentBracketGenerator,
  Match,
  Round,
  TournamentBracket,
  TournamentRankings,
} from "../../../types/strategy/ITournamentBracketGenerator";
import type { TournamentResults } from "../../../types/tournament/tournament";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { RNG } from "../../games/rng";
import { StrategyManager } from "../strategyManager";
import type { IUserSampler } from "../../../types/strategy/IUserSampler";

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
  protected userSampler: StrategyManager<IUserSampler, "sampleUser">;

  // Track current round
  protected currentRoundIndex: number = -1;

  // Store all players and their stats
  protected playerStats: Map<string, PlayerStats> = new Map();

  // Track active matches in current round
  protected activeMatches: Set<string> = new Set();

  // Store results for ranking computation
  protected matchResults: Map<string, Match> = new Map();

  // Track ranked players by match
  protected matchRankedPlayers: Map<string, string[]> = new Map();

  // Store all rounds for final ranking
  protected allRounds: Round[] = [];

  // Track which players should move to which matches
  protected playersNextMatch: Map<string, string> = new Map();

  // Store players who need to be assigned to matches in future rounds
  protected pendingPlayers: Map<number, string[]> = new Map();

  // Track all active players (not eliminated or qualified)
  protected activePlayers: Set<string> = new Set();

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;
    this.playersPerMatch = tournamentData.gameData.playerCount;

    this.roundCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].roundCount;
    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;
    this.finalGamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].finalGamesCount;

    // Initialize user sampler
    this.userSampler = new StrategyManager(
      this.tournamentData.initialSeedingMethod || "random",
      "userSampler",
      "sampleUser",
    );

    // Initialize player stats
    this.initializePlayerStats();

    // Initialize active players
    this.tournamentData.players.forEach((playerId: string) => {
      this.activePlayers.add(playerId);
    });

    // Generate the entire bracket structure
    this.generateEntireBracket();

    console.log(
      `Swiss Round Tournament initialized with ${this.tournamentData.players.length} players`,
    );
    console.log(
      `Round count: ${this.roundCount}, Games per match: ${this.gamesCount}, Final games: ${this.finalGamesCount}`,
    );
    console.log(`Total rounds generated: ${this.allRounds.length}`);
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

  /**
   * Generate the entire bracket structure
   */
  private generateEntireBracket(): void {
    console.log("Generating complete Swiss Round bracket");

    // Seed players into the first round
    this.seedPlayersIntoFirstRound();

    // Generate additional rounds with placeholder matches
    this.generateAdditionalRounds();

    // Log the generated bracket structure
    console.log(`Generated ${this.allRounds.length} rounds`);
    this.allRounds.forEach((round, index) => {
      console.log(`Round ${index + 1}: ${Object.keys(round).length} matches`);
    });
  }

  /**
   * Seed players into the first round using the userSampler
   */
  private seedPlayersIntoFirstRound(): void {
    const players = [...this.tournamentData.players];
    let remainingPlayers = [...players];

    // Create the first round
    const firstRound: Round = {};

    // Calculate how many matches we need in the first round
    const matchCount = Math.ceil(players.length / this.playersPerMatch);

    // Create matches and seed players
    for (let i = 0; i < matchCount; i++) {
      const matchID = `R1_M${i}`;
      const matchPlayers: string[] = [];

      // Select players for this match using the userSampler
      for (
        let j = 0;
        j < this.playersPerMatch && remainingPlayers.length > 0;
        j++
      ) {
        // Sample a player using the userSampler
        const selectedPlayer =
          this.userSampler.executeStrategy(remainingPlayers);
        matchPlayers.push(selectedPlayer);

        // Remove the selected player from the remaining players
        remainingPlayers = remainingPlayers.filter((p) => p !== selectedPlayer);
      }

      // Create the match with the selected players
      const results: Record<string, number[]> = {};
      matchPlayers.forEach((playerId) => {
        results[playerId] = [];
      });

      firstRound[matchID] = {
        gamesCount: this.gamesCount,
        winner: "",
        results,
      };
    }

    // Add the first round to allRounds
    this.allRounds.push(firstRound);
  }

  /**
   * Generate additional rounds with placeholder matches
   */
  private generateAdditionalRounds(): void {
    // We already have the first round, so start from the second
    for (let roundIndex = 1; roundIndex < this.roundCount * 2; roundIndex++) {
      const round: Round = {};
      // Calculate minimum number of matches needed for this round
      const matchCount = Math.ceil(
        this.tournamentData.players.length / this.playersPerMatch / 2,
      );

      // Create placeholder matches for this round
      for (let i = 0; i < matchCount; i++) {
        const matchID = `R${roundIndex + 1}_M${i}`;

        // Create placeholder player IDs for this match
        const placeholderPlayers: string[] = [];
        for (let j = 0; j < this.playersPerMatch; j++) {
          placeholderPlayers.push(`TBD_R${roundIndex + 1}_M${i}_P${j}`);
        }

        // Initialize results for each player
        const results: Record<string, number[]> = {};
        placeholderPlayers.forEach((playerId) => {
          results[playerId] = [];
        });

        // Add the match to the round
        const isFinalRound = roundIndex + 1 >= this.roundCount;
        const gamesForMatch = isFinalRound
          ? this.finalGamesCount
          : this.gamesCount;

        round[matchID] = {
          gamesCount: gamesForMatch,
          winner: "",
          results,
        };
      }

      // Add the round to allRounds
      this.allRounds.push(round);
    }

    // Initialize pendingPlayers for each round
    for (let i = 0; i <= this.allRounds.length; i++) {
      this.pendingPlayers.set(i, []);
    }
  }

  /**
   * Returns the next round of matches to be played
   */
  nextRound(): Round {
    // Clear active matches for the new round
    this.activeMatches.clear();

    // Move to next round
    this.currentRoundIndex++;

    // If we're out of rounds, return empty round
    if (this.currentRoundIndex >= this.allRounds.length) {
      return {};
    }

    // Get the current round
    const currentRound = { ...this.allRounds[this.currentRoundIndex] };

    // If this is not the first round, assign players to matches
    if (this.currentRoundIndex > 0) {
      this.assignPlayersToMatches(currentRound);
    }

    // Set up tracking for the new round's matches
    Object.keys(currentRound).forEach((matchID) => {
      // Only add a match if it has real players (not just placeholders)
      const match = currentRound[matchID];
      const hasRealPlayers = Object.keys(match.results).some(
        (playerId) => !playerId.startsWith("TBD_"),
      );

      if (hasRealPlayers) {
        this.activeMatches.add(matchID);
      }
    });

    // Add the updated round back to the collection
    this.allRounds[this.currentRoundIndex] = currentRound;

    return currentRound;
  }

  /**
   * Group players by their record (wins-losses)
   */
  private groupPlayersByRecord(): Map<string, string[]> {
    const recordGroups = new Map<string, string[]>();

    // Group active players by their win-loss record
    for (const playerId of this.activePlayers) {
      const stats = this.playerStats.get(playerId)!;

      // Skip eliminated or qualified players
      if (stats.eliminated || stats.qualified) {
        continue;
      }

      const record = `${stats.wins}-${stats.losses}`;

      if (!recordGroups.has(record)) {
        recordGroups.set(record, []);
      }

      recordGroups.get(record)!.push(playerId);
    }

    return recordGroups;
  }

  /**
   * Assign players to matches for the current round based on their stats
   */
  private assignPlayersToMatches(round: Round): void {
    // Group players by their record
    const playersByRecord = this.groupPlayersByRecord();

    // Create a pool of all players that need to be assigned
    let allPendingPlayers: string[] = [];
    for (const players of playersByRecord.values()) {
      allPendingPlayers = allPendingPlayers.concat(players);
    }

    console.log(
      `Assigning ${allPendingPlayers.length} players to round ${this.currentRoundIndex + 1}`,
    );

    // Log players by their records
    for (const [record, players] of playersByRecord.entries()) {
      console.log(
        `Assigning players with ${record}: ${players.length} players`,
      );
    }

    // Sort rounds by win count (descending) then loss count (ascending)
    const sortedRecords = Array.from(playersByRecord.keys()).sort((a, b) => {
      const [winsA, lossesA] = a.split("-").map(Number);
      const [winsB, lossesB] = b.split("-").map(Number);

      if (winsA !== winsB) return winsB - winsA;
      return lossesA - lossesB;
    });

    // Process each record group
    let matchIndex = 0;
    const assignedPlayers = new Set<string>();

    for (const record of sortedRecords) {
      const players = playersByRecord.get(record) || [];
      const remainingPlayers = this.shufflePlayers(players);

      // Create matches for this record group
      while (remainingPlayers.length >= this.playersPerMatch) {
        // Find or create a match
        const matchID = `R${this.currentRoundIndex + 1}_M${matchIndex}`;
        matchIndex++;

        // Find match in the round or create a new one
        if (!round[matchID]) {
          // Create a new match if needed
          const isFinalRound = this.currentRoundIndex >= this.roundCount;
          const gamesForMatch = isFinalRound
            ? this.finalGamesCount
            : this.gamesCount;

          round[matchID] = {
            gamesCount: gamesForMatch,
            winner: "",
            results: {},
          };
        }

        // Clear any placeholder players
        const match = round[matchID];
        for (const pid of Object.keys(match.results)) {
          if (pid.startsWith("TBD_")) {
            delete match.results[pid];
          }
        }

        // Add real players to the match
        const matchPlayers: string[] = [];

        for (
          let i = 0;
          i < this.playersPerMatch && remainingPlayers.length > 0;
          i++
        ) {
          // Try to find a player who hasn't played against others in this match
          let selectedIndex = -1;

          for (let j = 0; j < remainingPlayers.length; j++) {
            const playerId = remainingPlayers[j];
            const playerStats = this.playerStats.get(playerId)!;

            // Check if this player has played against any currently selected players
            const hasPlayedAgainst = matchPlayers.some((opponent) =>
              playerStats.opponents.has(opponent),
            );

            if (!hasPlayedAgainst) {
              selectedIndex = j;
              break;
            }
          }

          // If no perfect match found, just take the first available player
          if (selectedIndex === -1 && remainingPlayers.length > 0) {
            selectedIndex = 0;
          }

          // Add player to match if found
          if (selectedIndex !== -1) {
            const playerId = remainingPlayers[selectedIndex];
            matchPlayers.push(playerId);
            match.results[playerId] = [];
            assignedPlayers.add(playerId);
            remainingPlayers.splice(selectedIndex, 1);
          }
        }

        // Register this as an active match if it has players
        if (Object.keys(match.results).length > 0) {
          this.activeMatches.add(matchID);
        }
      }

      // Add any remaining players to the unassigned pool for the next record group
      remainingPlayers.forEach((playerId) => {
        if (!assignedPlayers.has(playerId)) {
          // Will be handled in cleanup pass
          console.log(
            `Player ${playerId} couldn't be assigned in their record group`,
          );
        }
      });
    }

    // Handle unassigned players as a final pass
    const unassignedPlayers = allPendingPlayers.filter(
      (playerId) => !assignedPlayers.has(playerId),
    );

    if (unassignedPlayers.length > 0) {
      console.log(`Handling ${unassignedPlayers.length} unassigned players`);

      let currentPlayers = [...unassignedPlayers];

      while (currentPlayers.length > 0) {
        // Create a new match for these players
        const matchID = `R${this.currentRoundIndex + 1}_M${matchIndex}`;
        matchIndex++;

        // Create the match
        const isFinalRound = this.currentRoundIndex >= this.roundCount;
        const gamesForMatch = isFinalRound
          ? this.finalGamesCount
          : this.gamesCount;

        const match: Match = {
          gamesCount: gamesForMatch,
          winner: "",
          results: {},
        };

        // Add players to the match (up to player count or all remaining)
        const playerCount = Math.min(
          this.playersPerMatch,
          currentPlayers.length,
        );
        for (let i = 0; i < playerCount; i++) {
          const playerId = currentPlayers[i];
          match.results[playerId] = [];
        }

        // Remove added players from the pool
        currentPlayers = currentPlayers.slice(playerCount);

        // Add match to round
        round[matchID] = match;
        this.activeMatches.add(matchID);
      }
    }

    // Clean up any matches that still only have placeholder players
    Object.keys(round).forEach((matchID) => {
      const match = round[matchID];
      const hasRealPlayers = Object.keys(match.results).some(
        (pid) => !pid.startsWith("TBD_"),
      );

      if (!hasRealPlayers) {
        delete round[matchID];
      }
    });
  }

  /**
   * Handle match completion notification
   */
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean {
    if (!this.activeMatches.has(matchID)) {
      console.error(`Match ${matchID} not found in active matches`);
      return false;
    }

    // Find the match in the current round
    const match = this.allRounds[this.currentRoundIndex][matchID];

    if (!match) {
      console.error(`Match ${matchID} not found in current round`);
      return false;
    }

    // Get the players in order of their performance (first place first)
    const rankedPlayers = Object.entries(gameResult)
      .sort((a, b) => a[1] - b[1])
      .map((entry) => entry[0]);

    // Store the ranked players for this match
    this.matchRankedPlayers.set(matchID, rankedPlayers);

    // Store the match for final results
    this.matchResults.set(matchID, match);

    // First player is the winner
    const winner = rankedPlayers[0];
    match.winner = winner;

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
        this.activePlayers.delete(playerId);
      }

      if (stats.losses >= this.roundCount) {
        stats.eliminated = true;
        console.log(
          `Player ${playerId} has been ELIMINATED with ${stats.losses} losses`,
        );
        this.activePlayers.delete(playerId);
      }

      // Update opponent records
      rankedPlayers.forEach((opponent) => {
        if (opponent !== playerId) {
          stats.opponents.add(opponent);
        }
      });
    });
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

  getCompleteBracket(): TournamentBracket {
    return {
      rounds: this.allRounds,
      seeding: new Map(),
    };
  }
}
