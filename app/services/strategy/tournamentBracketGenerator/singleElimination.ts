import type {
  TournamentResults,
  PlayerResults,
} from "../../../types/tournament/tournament";
import { RNG } from "../../games/rng";
import type {
  Match,
  Round,
  TournamentRankings,
  ITournamentBracketGenerator,
  GameResult,
  TournamentBracket,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { StrategyManager } from "../strategyManager";
import type { IUserSampler } from "../../../types/strategy/IUserSampler";
import { fastifyInstance } from "../../../app";

type OverallPlayerResults = {
  lastRoundPlayed: number;
  totalWins: number;
  totalScore: number;
};

type OverallResults = {
  [playerID: string]: OverallPlayerResults;
};

export class SingleElimination implements ITournamentBracketGenerator {
  name = "singleElimination";

  protected tournamentData: Record<string, any>;
  protected gamesCount: number;
  protected playersPerMatch: number;
  protected rng: RNG = new RNG();
  protected userSampler: StrategyManager<IUserSampler, "sampleUser">;

  // Store rounds and match data
  protected rounds: Round[] = [];
  protected currentRoundIndex: number = -1;
  protected matchResults: Map<string, Match> = new Map();

  // Track ranked players by match ID
  protected matchRankedPlayers: Map<string, string[]> = new Map();

  // Store the next matches for each match based on performance ranking
  protected nextMatchSeeding: Map<string, string[]> = new Map();

  // Track active matches in current round
  protected activeMatches: Set<string> = new Set();

  // Track the last round each player participated in
  protected playersLastRound: { [playerID: string]: number } = {};

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;
    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;

    // Number of players in each match
    this.playersPerMatch = tournamentData.gameData.playerCount;

    // Initialize user sampler
    this.userSampler = new StrategyManager(
      this.tournamentData.initialSeedingMethod,
      "userSampler",
      "sampleUser",
    );

    // Generate the entire bracket with proper seeding
    this.generateEntireBracket();

    fastifyInstance.log.debug(
      `Generated ${this.rounds.length} rounds for single elimination bracket`,
    );
    this.rounds.forEach((round, index) => {
      fastifyInstance.log.debug(
        `Round ${index + 1}: ${Object.keys(round).length} matches`,
      );
    });
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
    if (this.currentRoundIndex >= this.rounds.length) {
      return {};
    }

    // Get the next round from our pre-generated structure
    const nextRound = this.rounds[this.currentRoundIndex];

    // Set up tracking for the new round's matches
    Object.keys(nextRound).forEach((matchID) => {
      this.activeMatches.add(matchID);
    });

    return nextRound;
  }

  /**
   * Called by Tournament when a match is complete and winner is determined
   */
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean {
    if (!this.activeMatches.has(matchID)) {
      console.error(`Match ${matchID} not found in active matches`);
      return false;
    }

    // Get the match from current round
    const match = this.rounds[this.currentRoundIndex][matchID];

    // Get the players in order of their performance (first place first)
    const rankedPlayers = Object.entries(gameResult)
      .sort((a, b) => a[1] - b[1])
      .map((entry) => entry[0]);

    // Store the ranked players for this match
    this.matchRankedPlayers.set(matchID, rankedPlayers);

    // Store the match for final results
    this.matchResults.set(matchID, match);

    // Remove from active matches
    this.activeMatches.delete(matchID);

    // Handle match results and push players to their next matches
    this.handleMatchResults(matchID, rankedPlayers);

    return this.activeMatches.size === 0;
  }

  /**
   * Handle match results and push players to their next matches
   */
  protected handleMatchResults(matchID: string, rankedPlayers: string[]): void {
    // Get the next match seeding for this match
    const seedingArray = this.nextMatchSeeding.get(matchID) || [];

    // Process each player based on their ranking
    rankedPlayers.forEach((player, index) => {
      // In single elimination, only the winner (index 0) advances
      if (index === 0 && seedingArray.length > 0) {
        const nextMatchID = seedingArray[0];
        // Push the winner to their next match
        this.pushPlayerToNextMatch(player, nextMatchID);
      } else {
        // All other players are eliminated
        this.playersLastRound[player] = this.currentRoundIndex;
      }
    });

    // Special case for final match (last round)
    if (this.isLastRound(this.currentRoundIndex) && rankedPlayers.length > 0) {
      // Champion gets an extra round in scoring to differentiate from runners-up
      this.playersLastRound[rankedPlayers[0]] = this.currentRoundIndex + 1;
    }
  }

  /**
   * Push player to their next match
   */
  protected pushPlayerToNextMatch(playerId: string, nextMatchId: string): void {
    // Find the target round and match
    let targetRoundIndex = -1;
    let targetMatch: Match | null = null;

    for (let i = 0; i < this.rounds.length; i++) {
      if (Object.keys(this.rounds[i]).includes(nextMatchId)) {
        targetRoundIndex = i;
        targetMatch = this.rounds[i][nextMatchId];
        break;
      }
    }

    if (targetRoundIndex === -1 || !targetMatch) {
      console.error(
        `Could not find match ${nextMatchId} for player ${playerId}`,
      );
      // Record this as player's last round since they have nowhere to go
      this.playersLastRound[playerId] = this.currentRoundIndex;
      return;
    }

    // Remove any TBD placeholders in the target match
    Object.keys(targetMatch.results).forEach((pid) => {
      if (pid.startsWith("TBD_")) {
        delete targetMatch.results[pid];
      }
    });

    // Add the player to the target match's results
    if (!targetMatch.results[playerId]) {
      targetMatch.results[playerId] = [];
    }

    fastifyInstance.log.debug(
      `Pushed player ${playerId} to next match ${nextMatchId}`,
    );
  }

  /**
   * Generate the entire bracket with proper seeding
   */
  protected generateEntireBracket(): void {
    // Calculate total players and determine total rounds needed
    const players = [...this.tournamentData.players];
    const totalPlayers = players.length;

    // Calculate matches in first round
    const firstRoundMatches = Math.ceil(totalPlayers / this.playersPerMatch);

    // Calculate total rounds needed
    const totalRounds = Math.ceil(Math.log2(firstRoundMatches) + 1);

    // Generate placeholder structure for all rounds
    this.generateRoundStructure(totalRounds, firstRoundMatches);

    // Setup seeding between rounds
    this.setupBracketSeeding();

    // Apply seeding to place players in first round
    this.seedPlayersIntoFirstRound(players);
  }

  /**
   * Generate the structure of all rounds
   */
  protected generateRoundStructure(
    totalRounds: number,
    firstRoundMatchCount: number,
  ): void {
    // Start with an empty rounds array
    this.rounds = [];

    // Generate each round structure
    let prevRoundMatchCount = firstRoundMatchCount;

    for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
      const round: Round = {};
      const matchesInThisRound =
        roundIndex === 0
          ? firstRoundMatchCount
          : Math.ceil(prevRoundMatchCount / 2);

      // Create placeholder matches for this round
      for (let i = 0; i < matchesInThisRound; i++) {
        // Create placeholder player IDs for this match
        const placeholderPlayers: string[] = [];
        for (let j = 0; j < this.playersPerMatch; j++) {
          placeholderPlayers.push(`TBD_r${roundIndex + 1}m${i}_P${j}`);
        }

        // Create a match ID
        const matchID = `r${roundIndex + 1}m${i}`;

        // Initialize results for each player
        const results: Record<string, number[]> = {};
        placeholderPlayers.forEach((playerID) => {
          results[playerID] = [];
        });

        // Add the match to the round
        round[matchID] = {
          gamesCount: this.gamesCount,
          winner: "",
          results: results,
        };
      }

      // Add this round to our rounds array
      this.rounds.push(round);

      // Update for next iteration
      prevRoundMatchCount = matchesInThisRound;
    }
  }

  /**
   * Setup seeding between rounds
   */
  protected setupBracketSeeding(): void {
    // For each round (except the final)
    for (
      let roundIndex = 0;
      roundIndex < this.rounds.length - 1;
      roundIndex++
    ) {
      const currentRound = this.rounds[roundIndex];
      const nextRoundIndex = roundIndex + 1;

      // For each match in current round
      Object.keys(currentRound).forEach((matchID, matchIndex) => {
        // Calculate the next match ID (halving the index for next round)
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatchID = `r${nextRoundIndex + 1}m${nextMatchIndex}`;

        // In single elimination, only the winner advances
        this.nextMatchSeeding.set(matchID, [nextMatchID]);
      });
    }

    // For the final match, there's no next match
    if (this.rounds.length > 0) {
      const finalRound = this.rounds[this.rounds.length - 1];
      Object.keys(finalRound).forEach((matchID) => {
        this.nextMatchSeeding.set(matchID, []);
      });
    }
  }

  /**
   * Seed players into the first round using the userSampler
   */
  protected seedPlayersIntoFirstRound(players: string[]): void {
    let remainingPlayers = [...players];
    const firstRound = this.rounds[0];

    // For each match in the first round
    Object.keys(firstRound).forEach((matchID) => {
      const match = firstRound[matchID];
      const matchPlayers: string[] = [];

      // Select players for this match using the userSampler
      for (
        let i = 0;
        i < this.playersPerMatch && remainingPlayers.length > 0;
        i++
      ) {
        // Sample a player using the userSampler
        const selectedPlayer =
          this.userSampler.executeStrategy(remainingPlayers);
        matchPlayers.push(selectedPlayer);

        // Remove the selected player from the remaining players
        remainingPlayers = remainingPlayers.filter((p) => p !== selectedPlayer);
      }

      // Reset the match results with the selected players
      match.results = {};
      matchPlayers.forEach((playerID) => {
        match.results[playerID] = [];
      });
    });
  }

  /**
   * Checks if the given round index is the last round
   */
  protected isLastRound(roundIndex: number): boolean {
    return roundIndex === this.rounds.length - 1;
  }

  computeFinalRankings(
    allMatchesResults: TournamentResults,
  ): TournamentRankings {
    const overallResults: OverallResults = {};

    /**
     * Breaks ties using totalWins first then totalScore
     * @param playerAOverallResults
     * @param playerBOverallResults
     * @returns tie Winner or {-1, -1} if completely equal.
     */
    function tieBreaker(
      playerAOverallResults: OverallPlayerResults,
      playerBOverallResults: OverallPlayerResults,
    ): number {
      if (
        playerAOverallResults.lastRoundPlayed ===
        playerBOverallResults.lastRoundPlayed
      ) {
        if (
          playerAOverallResults.totalWins === playerBOverallResults.totalWins
        ) {
          if (
            playerAOverallResults.totalScore ===
            playerBOverallResults.totalScore
          )
            return 0;
          return playerAOverallResults.totalScore <
            playerBOverallResults.totalScore
            ? -1
            : 1;
        }
        return playerAOverallResults.totalWins > playerBOverallResults.totalWins
          ? -1
          : 1;
      }

      return playerAOverallResults.lastRoundPlayed >
        playerBOverallResults.lastRoundPlayed
        ? -1
        : 1;
    }

    function sortPlayers(
      a: [string, OverallPlayerResults],
      b: [string, OverallPlayerResults],
    ): number {
      return tieBreaker(a[1], b[1]);
    }

    Object.entries(allMatchesResults).forEach(
      (entry: [string, PlayerResults[]]) => {
        let totalScore = 0;
        let totalWins = 0;

        entry[1].forEach((matchResult: PlayerResults) => {
          Object.values(matchResult).forEach(
            (playerResult: { won: boolean; results: number[] }) => {
              totalWins += playerResult.won ? 1 : 0;
              totalScore += playerResult.results.reduce(
                (prev, curr) => prev + curr,
                0,
              );
            },
          );
        });

        overallResults[entry[0]] = {
          lastRoundPlayed: this.playersLastRound[entry[0]],
          totalScore: totalScore,
          totalWins: totalWins,
        };
      },
    );

    const sortedOverallResults =
      Object.entries(overallResults).sort(sortPlayers);
    const tournamentRankings: TournamentRankings = {};

    sortedOverallResults.forEach(
      (entry: [string, OverallPlayerResults], index) => {
        tournamentRankings[entry[0]] = index + 1;
      },
    );

    return tournamentRankings;
  }

  /**
   * Helper method for the Tournament to check if a match is still active
   */
  isMatchActive(matchID: string): boolean {
    return this.activeMatches.has(matchID);
  }

  getCompleteBracket(): TournamentBracket {
    return {
      rounds: this.rounds,
      seeding: this.nextMatchSeeding,
    };
  }
}
