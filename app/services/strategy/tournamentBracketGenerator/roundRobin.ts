import {
  PlayerResults,
  type TournamentResults,
} from "../../tournament/tournament";
import { RNG } from "../../games/rng";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";
import {
  type Match,
  type MatchResults,
  type Round,
  type ITournamentBracketGenerator,
} from "../../../types/strategy/ITournamentBracketGenerator";

export type Results = {
  [matchID: string]: Match;
};

export class RoundRobin implements ITournamentBracketGenerator {
  name = "roundRobin";

  protected tournamentData: Record<string, any>;
  protected gamesCount: number;

  protected possibleRounds: Round[] = [];
  // Store results as a map of matchIDs to game results arrays
  protected rng: RNG = new RNG();
  protected currentRoundIndex: number = 0;

  protected resultMap: Results = {};

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;

    console.log(`Tournament data:`);
    console.dir(this.tournamentData);

    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;

    // Generate match schedule based on number positions (0, 1, 2, ...)
    const numericMatches = this.generateMatchSchedule(
      this.tournamentData.playerCount,
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

        const results: MatchResults = {};
        players.forEach((playerID) => (results[playerID] = []));

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

    console.log(`Rounds:`);
    console.dir(this.possibleRounds, { depth: null });
  }

  nextRound(lastRoundResults?: Round): Round {
    if (lastRoundResults && Object.keys(lastRoundResults).length > 0) {
      this.saveResult(lastRoundResults);
    }

    if (this.possibleRounds.length === 0) {
      return {};
    }

    const nextRound = this.possibleRounds.pop();
    if (!nextRound) {
      console.error(`no more possibleRounds`);
      return {};
    }

    return nextRound;
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

    console.log(`Combinations:`);
    console.dir(combinations);

    // Calculate theoretical maximum number of matches per round
    const maxMatchesPerRound = Math.floor(numPlayers / playersPerMatch);
    console.log(`${maxMatchesPerRound} matches per round (theoretical max)`);

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

  protected saveResult(roundResults: Round) {
    for (const matchID in roundResults) {
      const match = roundResults[matchID];
      this.resultMap[matchID] = match;
    }
  }

  /**
   * Generate the final tournament results for each player
   */
  finalResults(): TournamentResults {
    const tournamentResults: TournamentResults = {};

    (this.tournamentData.players as string[]).forEach((playerID) => {
      const playerResults: PlayerResults[] = [];

      Object.entries(this.resultMap)
        .filter((entry: [string, Match]) => this.isInMatch(playerID, entry[0]))
        .forEach((entry: [string, Match]) => {
          playerResults.push({
            [entry[0]]: {
              results: entry[1].results[playerID],
              won: entry[1].winner === playerID,
            },
          } as PlayerResults);
        });

      tournamentResults[playerID] = playerResults;
    });

    return tournamentResults;
  }

  getMatchKey(players: string[]): string {
    const sortedPlayers = [...players].sort();
    const matchID = sortedPlayers.join("|");
    return matchID;
  }

  isInMatch(playerID: string, matchID: string): boolean {
    const players = matchID.split("|");
    return players.includes(playerID);
  }
}
