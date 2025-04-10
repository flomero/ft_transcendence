import {
  type TournamentResults,
  type PlayerResults,
} from "../../../types/tournament/tournament";
import { RNG } from "../../games/rng";
import {
  type Match,
  type Round,
  type TournamentRankings,
  type ITournamentBracketGenerator,
  type GameResult,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import { StrategyManager } from "../strategyManager";
import { IUserSampler } from "../../../types/strategy/IUserSampler";

type Bracket = "upper" | "lower" | "final";

type OverallPlayerResults = {
  lastRoundPlayed: number;
  totalWins: number;
  totalScore: number;
};

type OverallResults = {
  [playerID: string]: OverallPlayerResults;
};

export class DoubleElimination implements ITournamentBracketGenerator {
  name = "doubleElimination";

  protected tournamentData: Record<string, any>;
  protected gamesCount: number;
  protected playersPerMatch: number;
  protected rng: RNG = new RNG();
  protected userSampler: StrategyManager<IUserSampler, "sampleUser">;

  // Store rounds and match data
  protected upperRounds: Round[] = [];
  protected lowerRounds: Round[] = [];
  protected finalRound: Round = {};
  protected allRounds: Round[] = [];
  protected currentRoundIndex: number = -1;
  protected matchResults: Map<string, Match> = new Map();

  // Track ranked players by match ID
  protected matchRankedPlayers: Map<string, string[]> = new Map();

  // Store the next matches for each match based on performance ranking
  // For each match, store an array of next match IDs, one for each position
  // [upperBracketMatch, lowerBracketMatch] for upper bracket matches
  // [nextLowerMatch] for lower bracket matches
  protected nextMatchSeeding: Map<string, string[]> = new Map();

  // Map to track which bracket a match belongs to
  protected matchBracket: Map<string, Bracket> = new Map();

  // Track active matches in current round
  protected activeMatches: Set<string> = new Set();

  protected playersLastRound: { [playerID: string]: number } = {};

  // Track players who have been eliminated (lost twice)
  protected eliminatedPlayers: Set<string> = new Set();

  // Track players who have lost once and are in lower bracket
  protected lowerBracketPlayers: Set<string> = new Set();

  // Store players waiting to be seeded into lower bracket matches
  protected pendingLowerBracketPlayers: Map<string, string[]> = new Map();

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

    console.log(`Generated rounds:`);
    console.log(`Upper bracket rounds: ${this.upperRounds.length}`);
    console.log(`Lower bracket rounds: ${this.lowerRounds.length}`);
    console.log(
      `Final rounds: ${Object.keys(this.finalRound).length > 0 ? 1 : 0}`,
    );

    // Log details for each round
    this.allRounds.forEach((round, index) => {
      console.log(`Round ${index + 1}: ${Object.keys(round).length} matches`);
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
    if (this.currentRoundIndex >= this.allRounds.length) {
      return {};
    }

    // Get the next round from our pre-generated structure
    const nextRound = this.allRounds[this.currentRoundIndex];

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
    const match = this.allRounds[this.currentRoundIndex][matchID];

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

    // Handle players according to match results
    this.handleMatchResults(matchID, rankedPlayers);

    return true;
  }

  /**
   * Unified handler for all match results using player rankings directly with seeding
   */
  protected handleMatchResults(matchID: string, rankedPlayers: string[]): void {
    const matchBracket = this.matchBracket.get(matchID) || "upper";
    const seedingArray = this.nextMatchSeeding.get(matchID) || [];

    // Process each player based on their ranking
    rankedPlayers.forEach((player, index) => {
      // If there's a seeding slot for this player's position
      if (index < seedingArray.length && seedingArray[index]) {
        const nextMatchID = seedingArray[index];

        // If player is moving to lower bracket, record this
        if (matchBracket === "upper" && index > 0) {
          this.lowerBracketPlayers.add(player);
        }

        // Push player to their next match
        this.pushPlayerToNextMatch(player, nextMatchID);
      }
      // No seeding slot available - player is eliminated
      else {
        // If in lower bracket, mark as eliminated
        if (matchBracket === "lower") {
          this.eliminatedPlayers.add(player);
        }

        // Record this as player's last round
        this.playersLastRound[player] = this.currentRoundIndex;
      }
    });

    // Special case for final match
    if (matchBracket === "final" && rankedPlayers.length > 0) {
      // Champion gets an extra round in scoring to differentiate
      this.playersLastRound[rankedPlayers[0]] = this.currentRoundIndex + 1;
    }
  }

  /**
   * Helper method to push a player to their next match
   */
  protected pushPlayerToNextMatch(playerId: string, nextMatchId: string): void {
    // Find the target round index for the next match
    let targetRoundIndex = -1;
    let targetMatch: Match | null = null;

    for (let i = 0; i < this.allRounds.length; i++) {
      if (Object.keys(this.allRounds[i]).includes(nextMatchId)) {
        targetRoundIndex = i;
        targetMatch = this.allRounds[i][nextMatchId];
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

    console.log(`Pushed player ${playerId} to next match ${nextMatchId}`);
  }

  /**
   * Generate the entire bracket with proper seeding
   */
  protected generateEntireBracket(): void {
    console.log(`Generating complete Bracket`);
    // Calculate total players and determine rounds needed
    const players = [...this.tournamentData.players];
    const totalPlayers = players.length;

    // For upper bracket
    const firstRoundMatches = Math.ceil(totalPlayers / this.playersPerMatch);
    const upperRoundCount = Math.ceil(Math.log2(totalPlayers));

    this.generateUpperBracket(upperRoundCount, firstRoundMatches);
    this.generateLowerBracket(upperRoundCount);
    this.generateFinalRound();

    // // Combine all rounds into a single array for sequential processing
    this.combineAllRounds();

    // // Apply seeding to place players in first round
    this.seedPlayersIntoFirstRound(players);
  }

  /**
   * Generate the upper bracket structure
   */
  protected generateUpperBracket(
    totalRounds: number,
    firstRoundMatchCount: number,
  ): void {
    // Start with an empty rounds array
    this.upperRounds = [];

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
          placeholderPlayers.push(`TBD_W${roundIndex + 1}_M${i}_P${j}`);
        }

        // Create a match ID
        const matchID = `W${roundIndex + 1}_M${i}`;

        // Track this match as upper bracket
        this.matchBracket.set(matchID, "upper");

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
      this.upperRounds.push(round);

      // Update for next iteration
      prevRoundMatchCount = matchesInThisRound;
    }

    // Setup seeding from upper to upper and upper to lower
    this.setupUpperBracketSeeding();
  }

  /**
   * Generate the lower bracket structure
   */
  protected generateLowerBracket(totalRounds: number): void {
    // Start with an empty rounds array
    this.lowerRounds = [];

    for (let roundIndex = 0; roundIndex < totalRounds - 1; ++roundIndex) {
      const firstRound: Round = {};
      const secondRound: Round = {};

      const firstLowerBracketRound = 2 * roundIndex + 1;
      const secondLowerBracketRound = 2 * (roundIndex + 1);
      const matchesInThisRound =
        this.tournamentData.playerCount / Math.pow(2, roundIndex + 2);

      // Create placeholder matches for this round
      for (let i = 0; i < matchesInThisRound; i++) {
        const firstLowerBracketMatchID = `L${firstLowerBracketRound}_M${i}`;
        const secondLowerBracketMatchID = `L${secondLowerBracketRound}_M${i}`;

        // Create placeholder player IDs for this match
        const firstRoundPlaceholderPlayers: string[] = [];
        const secondRoundPlaceholderPlayers: string[] = [];
        for (let j = 0; j < this.playersPerMatch; j++) {
          firstRoundPlaceholderPlayers.push(
            `TBD_${firstLowerBracketMatchID}_P${j}`,
          );
          secondRoundPlaceholderPlayers.push(
            `TBD_${secondLowerBracketMatchID}_P${j}`,
          );
        }

        // Track this match as lower bracket
        this.matchBracket.set(firstLowerBracketMatchID, "lower");
        this.matchBracket.set(secondLowerBracketMatchID, "lower");

        // Initialize results for each player
        const firstRoundResults: Record<string, number[]> = {};
        firstRoundPlaceholderPlayers.forEach((playerID) => {
          firstRoundResults[playerID] = [];
        });

        const secondRoundResults: Record<string, number[]> = {};
        secondRoundPlaceholderPlayers.forEach((playerID) => {
          secondRoundResults[playerID] = [];
        });

        // Add the match to the rounds
        firstRound[firstLowerBracketMatchID] = {
          gamesCount: this.gamesCount,
          winner: "",
          results: firstRoundResults,
        };

        secondRound[secondLowerBracketMatchID] = {
          gamesCount: this.gamesCount,
          winner: "",
          results: secondRoundResults,
        };
      }

      // Add those rounds to our rounds array
      this.lowerRounds.push(firstRound);
      this.lowerRounds.push(secondRound);
    }

    // Setup seeding within lower bracket
    this.setupLowerBracketSeeding();
  }

  /**
   * Generate the final round (upper bracket winner vs lower bracket winner)
   */
  protected generateFinalRound(): void {
    // Create a final match
    const matchID = "FINAL";

    // Track this match as final bracket
    this.matchBracket.set(matchID, "final");

    // Create placeholder player IDs
    const placeholderPlayers = ["TBD_UPPER_WINNER", "TBD_LOWER_WINNER"];

    // Initialize results for each player
    const results: Record<string, number[]> = {};
    placeholderPlayers.forEach((playerID) => {
      results[playerID] = [];
    });

    // Create the final match
    this.finalRound[matchID] = {
      gamesCount: this.gamesCount,
      winner: "",
      results: results,
    };

    // Setup seeding to final match
    this.setupFinalSeeding();
  }

  /**
   * Combine all rounds into a single sequential array
   */
  protected combineAllRounds(): void {
    this.allRounds = [];

    // First add first upper bracket round
    this.allRounds.push(this.upperRounds[0]);

    // Then each remaining upper bracket rounds can be played in parallel with a lower bracket round
    for (
      let roundIndex = 1;
      roundIndex < this.upperRounds.length;
      ++roundIndex
    ) {
      this.allRounds.push(
        this.combineRounds([
          this.upperRounds[roundIndex],
          this.lowerRounds[roundIndex - 1],
        ]),
      );
    }

    // Add the remaining lowerRounds
    for (
      let roundIndex = this.upperRounds.length - 1;
      roundIndex < this.lowerRounds.length;
      ++roundIndex
    )
      this.allRounds.push(this.lowerRounds[roundIndex]);

    // Add final round at the end
    if (Object.keys(this.finalRound).length > 0) {
      this.allRounds.push(this.finalRound);
    }
  }

  protected combineRounds(rounds: Round[]): Round {
    const combinedRounds: Round = {};

    rounds.forEach((round: Round) => {
      Object.entries(round).forEach(
        (entry) => (combinedRounds[entry[0]] = entry[1]),
      );
    });

    return combinedRounds;
  }

  /**
   * Setup seeding from upper bracket to upper bracket and upper to lower
   */
  protected setupUpperBracketSeeding(): void {
    // For each round in upper bracket
    this.upperRounds.forEach((round: Round, roundIndex) => {
      const isFirstRound = roundIndex === 0;
      const isLastRound = Object.keys(round).length === 1;
      const lowerBracketMatchCount = Object.keys(round).length;
      const firstLowerBracketRound = roundIndex + 1 === 1 ? 1 : 2 * roundIndex;

      Object.keys(round).forEach((matchID: string, matchIndex) => {
        if (isLastRound)
          this.nextMatchSeeding.set(matchID, [
            "FINAL",
            `L${firstLowerBracketRound}_M${matchIndex % lowerBracketMatchCount}`,
          ]);
        else if (isFirstRound) {
          const nextUpperMatchIndex = Math.floor(matchIndex / 2);
          const nextUpperMatchID = `W${roundIndex + 2}_M${nextUpperMatchIndex}`;
          this.nextMatchSeeding.set(matchID, [
            nextUpperMatchID,
            `L${firstLowerBracketRound}_M${matchIndex % Math.floor(lowerBracketMatchCount / 2)}`,
          ]);
        } else {
          const nextUpperMatchIndex = Math.floor(matchIndex / 2);
          const nextUpperMatchID = `W${roundIndex + 2}_M${nextUpperMatchIndex}`;
          this.nextMatchSeeding.set(matchID, [
            nextUpperMatchID,
            `L${firstLowerBracketRound}_M${matchIndex % lowerBracketMatchCount}`,
          ]);
        }
      });
    });

    console.log(`Seeding:`);
    console.dir(this.nextMatchSeeding, { depth: null });
  }

  /**
   * Setup seeding within lower bracket
   */
  protected setupLowerBracketSeeding(): void {
    this.lowerRounds.forEach((round: Round, roundIndex) => {
      const isLastRound = this.lowerRounds.length - 1 === roundIndex;
      const hasNewPlayers = (roundIndex + 1) % 2 === 0;

      if (isLastRound)
        this.nextMatchSeeding.set(Object.keys(round)[0], ["FINAL"]);
      else {
        if (hasNewPlayers)
          Object.keys(round).forEach((matchID: string, matchIndex) => {
            this.nextMatchSeeding.set(matchID, [
              `L${roundIndex + 2}_M${Math.floor(matchIndex / 2)}`,
            ]);
          });
        else
          Object.keys(round).forEach((matchID: string, matchIndex) => {
            this.nextMatchSeeding.set(matchID, [
              `L${roundIndex + 2}_M${matchIndex}`,
            ]);
          });
      }
    });
  }

  /**
   * Setup seeding for final round
   */
  protected setupFinalSeeding(): void {
    // Final has no next matches
    this.nextMatchSeeding.set("FINAL", []);
  }

  /**
   * Seed players into the first round using the userSampler
   */
  protected seedPlayersIntoFirstRound(players: string[]): void {
    let remainingPlayers = [...players];
    const firstRound = this.upperRounds[0];

    // For each match in the first round of upper bracket
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

  getCompleteBracket(): Round[] {
    return this.allRounds;
  }
}
