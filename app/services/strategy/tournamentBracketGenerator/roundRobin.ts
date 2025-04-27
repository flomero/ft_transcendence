import type {
  TournamentResults,
  PlayerResults,
} from "../../../types/tournament/tournament";
import { RNG } from "../../games/rng";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import type {
  Match,
  Round,
  TournamentRankings,
  ITournamentBracketGenerator,
  GameResult,
} from "../../../types/strategy/ITournamentBracketGenerator";

type Results = {
  [matchID: string]: Match;
};

type OverallPlayerResults = {
  totalWins: number;
  totalScore: number;
};

type OverallResults = {
  [playerID: string]: OverallPlayerResults;
};

export class RoundRobin implements ITournamentBracketGenerator {
  name = "roundRobin";

  protected tournamentData: Record<string, any>;
  protected gamesCount: number;
  protected possibleRounds: Round[] = [];
  protected rng: RNG = new RNG();
  protected resultMap: Results = {};

  // Track current active matches
  protected activeMatches: Set<string> = new Set<string>();

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;

    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;

    // Generate match schedule based on number positions (0, 1, 2, ...)
    const numericMatches = this.generateMatchSchedule(
      this.tournamentData.players.length,
      this.tournamentData.gameData.playerCount,
    );

    // Transform numeric schedule to actual player IDs and create proper round structure
    const playerRounds: Round[] = numericMatches.map((round) => {
      const roundObj: Round = {};

      round.forEach((matchPlayers) => {
        // Convert numeric player indices to actual player IDs
        const players = matchPlayers.map(
          (playerIndex) => this.tournamentData.players[playerIndex],
        );
        const matchID = this.getMatchKey(players);

        // Create an empty match structure with empty results
        const results: Record<string, number[]> = {};
        players.forEach((playerID) => {
          results[playerID] = [];
        });

        roundObj[matchID] = {
          gamesCount: this.gamesCount,
          winner: "",
          results: results,
        };
      });

      return roundObj;
    });

    // Randomize the rounds
    this.possibleRounds = this.rng.randomArray(playerRounds);
  }

  nextRound(): Round {
    // Clear active matches for the new round
    this.activeMatches.clear();

    if (this.possibleRounds.length === 0) {
      return {};
    }

    const nextRound = this.possibleRounds.pop();
    if (!nextRound) {
      console.error("no more possibleRounds");
      return {};
    }

    // Set up tracking for the new round's matches
    Object.keys(nextRound).forEach((matchID) => {
      this.activeMatches.add(matchID);
    });

    return nextRound;
  }

  /**
   * Handles game completion notification from the tournament
   * This method is still needed but has been simplified since match winner
   * determination is now handled by the separate match winner strategy
   *
   * @param matchID ID of the match that had a game completed
   * @param gameResult The result of a completed game mapping players to positions
   * @returns boolean indicating if the match was tracked by this bracket generator
   */
  notifyGameCompleted(matchID: string, gameResult: GameResult): boolean {
    // Simply check if this is a match we're tracking
    if (!this.activeMatches.has(matchID)) {
      console.error(`Match ${matchID} not found in active matches`);
      return false;
    }

    // We may want to store the final match result for our records
    // but we don't need to calculate winners anymore
    this.resultMap[matchID] = {
      gamesCount: this.gamesCount,
      winner: "", // Winner will be provided by the match winner strategy
      results: {}, // Results will be provided by the match winner strategy
    };

    console.log(`${matchID} finished, results:`);
    console.dir(gameResult, { depth: null });

    // Remove from active matches when complete
    this.activeMatches.delete(matchID);

    return true;
  }

  /**
   * Generates a schedule where each unique combination of players plays exactly one match,
   * maximizing the number of concurrent matches.
   *
   * @param numPlayers Total number of players
   * @param playersPerMatch Number of players in each match
   * @returns Array of rounds, where each round contains arrays of player indices representing matches
   */
  protected generateMatchSchedule(
    numPlayers: number,
    playersPerMatch: number,
  ): number[][][] {
    // Validate inputs
    if (numPlayers < playersPerMatch) {
      throw new Error(
        "Number of players must be greater than or equal to players per match",
      );
    }

    if (playersPerMatch < 2) {
      throw new Error("Players per match must be at least 2");
    }

    return this.generateGeneralMatchSchedule(numPlayers, playersPerMatch);
  }

  /**
   * Generates a schedule for matches with any number of players per match
   * Ensures each unique combination of players plays exactly one match
   * and maximizes parallel matches
   */
  protected generateGeneralMatchSchedule(
    numPlayers: number,
    playersPerMatch: number,
  ): number[][][] {
    // Generate all combinations of players of size playersPerMatch
    const combinations = this.generateCombinations(
      [...Array(numPlayers).keys()],
      playersPerMatch,
    );

    // Calculate theoretical maximum number of matches per round
    const maxMatchesPerRound = Math.floor(numPlayers / playersPerMatch);

    if (maxMatchesPerRound === 1) {
      return combinations.map((combination) => [combination]);
    }

    // Copy combinations to avoid modifying the original
    const remainingMatches = [...combinations];

    // Create rounds
    const rounds: number[][][] = [];

    // Main scheduling algorithm
    while (remainingMatches.length > 0) {
      const currentRound: number[][] = [];

      // Sort remaining matches by "difficulty" - matches that share players with
      // many other matches should be scheduled first
      remainingMatches.sort((a, b) => {
        const difficultyA = remainingMatches.filter(
          (m) => m !== a && m.some((p) => a.includes(p)),
        ).length;
        const difficultyB = remainingMatches.filter(
          (m) => m !== b && m.some((p) => b.includes(p)),
        ).length;
        return difficultyB - difficultyA; // Schedule most constrained matches first
      });

      // Function to check if a match would create conflicts with existing matches in the round
      const hasConflict = (match: number[], round: number[][]): boolean => {
        const playersInRound = new Set(round.flat());
        return match.some((player) => playersInRound.has(player));
      };

      // Process each potential match
      for (let i = 0; i < remainingMatches.length; i++) {
        // If this match doesn't conflict with current round, add it
        if (!hasConflict(remainingMatches[i], currentRound)) {
          const match = remainingMatches.splice(i, 1)[0];
          currentRound.push(match);
          i--; // Adjust index since we removed an item

          // If reached max matches per round, stop adding to this round
          if (currentRound.length >= maxMatchesPerRound) {
            break;
          }
        }
      }

      // If we added matches to this round, add it to our schedule
      if (currentRound.length > 0) {
        rounds.push(currentRound);
      } else {
        // If no matches could be added, we might have a problem
        // This shouldn't happen with valid inputs, but break to avoid infinite loop
        console.error("Could not schedule any more matches");
        break;
      }
    }

    // Post-processing: optimize rounds by moving matches to fill partially-filled rounds
    return this.optimizeRounds(rounds, maxMatchesPerRound);
  }

  /**
   * Optimize rounds by trying to move matches from later rounds to fill earlier rounds
   * that aren't at maximum capacity
   */
  protected optimizeRounds(
    rounds: number[][][],
    maxMatchesPerRound: number,
  ): number[][][] {
    const optimizedRounds = [...rounds];

    // Try to fill each partially-filled round
    for (let i = 0; i < optimizedRounds.length; i++) {
      // If this round is already at max capacity, skip
      if (optimizedRounds[i].length >= maxMatchesPerRound) {
        continue;
      }

      // Look for matches in later rounds that could be moved to this round
      for (let j = i + 1; j < optimizedRounds.length; j++) {
        if (optimizedRounds[i].length >= maxMatchesPerRound) {
          break; // This round is now full
        }

        // Try to find a match in round j that doesn't conflict with round i
        for (let k = 0; k < optimizedRounds[j].length; k++) {
          const candidate = optimizedRounds[j][k];
          const hasConflict = candidate.some((player) =>
            optimizedRounds[i].flat().includes(player),
          );

          if (!hasConflict) {
            // Move this match to the earlier round
            optimizedRounds[i].push(candidate);
            optimizedRounds[j].splice(k, 1);
            k--; // Adjust index since we removed an item

            // If later round is now empty, remove it
            if (optimizedRounds[j].length === 0) {
              optimizedRounds.splice(j, 1);
              j--; // Adjust index since we removed a round
              break;
            }

            // If this round is now full, move to next round
            if (optimizedRounds[i].length >= maxMatchesPerRound) {
              break;
            }
          }
        }
      }
    }

    // Remove any empty rounds (shouldn't happen, but just in case)
    return optimizedRounds.filter((round) => round.length > 0);
  }

  /**
   * Generates all combinations of size k from the given array
   */
  protected generateCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];

    function backtrack(start: number, current: T[]): void {
      if (current.length === k) {
        result.push([...current]);
        return;
      }

      for (let i = start; i < arr.length; i++) {
        current.push(arr[i]);
        backtrack(i + 1, current);
        current.pop();
      }
    }

    backtrack(0, []);
    return result;
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
      if (playerAOverallResults.totalWins === playerBOverallResults.totalWins) {
        if (
          playerAOverallResults.totalScore === playerBOverallResults.totalScore
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

  protected getMatchKey(players: string[]): string {
    const sortedPlayers = [...players].sort();
    const matchID = sortedPlayers.join("|");
    return matchID;
  }

  protected isInMatch(playerID: string, matchID: string): boolean {
    const players = matchID.split("|");
    return players.includes(playerID);
  }

  /**
   * Helper method for the Tournament to check if a match is still active
   */
  protected isMatchActive(matchID: string): boolean {
    return this.activeMatches.has(matchID);
  }

  getCompleteBracket(): Round[] {
    return this.possibleRounds;
  }
}
