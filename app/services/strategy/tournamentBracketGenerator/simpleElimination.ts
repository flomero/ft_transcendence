import { type TournamentResults } from "../../../types/tournament/tournament";
import { RNG } from "../../games/rng";
import {
  type Match,
  type Round,
  type ITournamentBracketGenerator,
  type GameResult,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { STRATEGY_REGISTRY } from "../strategyRegistryLoader";

export class SimpleElimination implements ITournamentBracketGenerator {
  name = "simpleElimination";

  protected tournamentData: Record<string, any>;
  protected gamesCount: number;
  protected playersPerMatch: number;
  protected rng: RNG = new RNG();

  // Store rounds and match data
  protected rounds: Round[] = [];
  protected currentRoundIndex: number = -1;
  protected matchResults: Map<string, Match> = new Map();

  // Track ranked players by match ID
  protected matchRankedPlayers: Map<string, string[]> = new Map();

  // Store the next matches for each match based on performance ranking
  // For each match, store an array of next match IDs, one for each position
  // e.g. [winner_match, loser_match] or [1st_place_match, 2nd_place_match, etc]
  protected nextMatchSeeding: Map<string, string[]> = new Map();

  // Track active matches in current round
  protected activeMatches: Set<string> = new Set();

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;
    this.gamesCount =
      STRATEGY_REGISTRY.tournamentBracketGenerator[this.name].gamesCount;

    // Number of players in each match
    this.playersPerMatch = tournamentData.gameData.playerCount;

    // Generate first round with all players
    this.generateFirstRound();

    // For elimination brackets, we can pre-generate the entire structure
    this.generateRemainingBracket();

    console.log(`Generated rounds:`);
    console.dir(this.rounds, { depth: null });

    console.log(
      `Generated ${this.rounds.length} rounds for elimination bracket`,
    );
    this.rounds.forEach((round, index) => {
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

    // Push players to their next matches based on seeding
    this.pushPlayersToNextMatches(matchID, rankedPlayers);

    return true;
  }

  /**
   * Push players to their next matches based on seeding
   */
  protected pushPlayersToNextMatches(
    matchID: string,
    rankedPlayers: string[],
  ): void {
    // Check if this match has seeding information
    const seedingArray = this.nextMatchSeeding.get(matchID);
    if (!seedingArray || seedingArray.length === 0) {
      console.log(
        `No next match seeding for ${matchID} - might be final match or elimination`,
      );
      return;
    }

    // Assign players to next matches based on their ranking
    rankedPlayers.forEach((playerId, rank) => {
      // Check if there's a next match for this rank
      if (rank < seedingArray.length && seedingArray[rank]) {
        const nextMatchId = seedingArray[rank];

        // Find the target round index for the next match
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

        console.log(
          `Pushed player ${playerId} (rank ${rank}) from ${matchID} to next match ${nextMatchId}`,
        );
      } else {
        console.log(
          `Player ${playerId} (rank ${rank}) from ${matchID} is eliminated or has no next match`,
        );
      }
    });
  }

  /**
   * Generate the first round with all players
   */
  protected generateFirstRound(): void {
    const players = [...this.tournamentData.players];

    // Shuffle the players for random seeding
    const shuffledPlayers = this.rng.randomArray([...players]);

    const round: Round = {};

    // Create matches for the first round
    for (let i = 0; i < shuffledPlayers.length; i += this.playersPerMatch) {
      // Get the players for this match
      const matchPlayers = shuffledPlayers.slice(i, i + this.playersPerMatch);

      // If we don't have enough players for a full match, we can:
      // 1. Give some players a bye to the next round, or
      // 2. Create an uneven match
      if (matchPlayers.length < this.playersPerMatch) {
        // For this implementation, we'll just create uneven matches
        // In a real tournament, you might want a more sophisticated approach
      }

      // Create the match
      const matchID = this.getMatchKey(matchPlayers);

      // Initialize results for each player
      const results: Record<string, number[]> = {};
      matchPlayers.forEach((playerID) => {
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
  }

  /**
   * Generate all remaining rounds in the bracket
   */
  protected generateRemainingBracket(): void {
    // Calculate how many matches in first round
    const firstRoundMatchCount = Object.keys(this.rounds[0]).length;

    // For single elimination, we need to calculate how many additional rounds we need
    // Calculate the number of rounds needed (log2 of the number of players, rounded up)
    // The first round is already created, so we need rounds - 1 more rounds
    const totalRounds = Math.ceil(Math.log2(firstRoundMatchCount)) + 1;
    const remainingRounds = totalRounds - 1; // Subtract the first round which is already created

    // Track where we are in the generation process
    let currentRoundIndex = 1; // Start after the first round (index 0)
    let prevRoundMatchCount = firstRoundMatchCount;

    // Create each subsequent round
    while (currentRoundIndex <= remainingRounds) {
      const round: Round = {};

      // Calculate matches in this round
      const matchesInThisRound = Math.ceil(prevRoundMatchCount / 2);

      // Create placeholder matches for this round
      for (let i = 0; i < matchesInThisRound; i++) {
        // Create placeholder player IDs for this match
        const placeholderPlayers: string[] = [];
        for (let j = 0; j < this.playersPerMatch; j++) {
          placeholderPlayers.push(`TBD_R${currentRoundIndex + 1}_M${i}_P${j}`);
        }

        // Create a placeholder match ID
        const matchID = `R${currentRoundIndex + 1}_M${i}`;

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

      // Set up seeding from previous round to this round
      const prevRoundIndex = currentRoundIndex - 1;
      const prevRound = this.rounds[prevRoundIndex];

      // For each pair of matches in previous round, winners go to the same match in this round
      let nextMatchIndex = 0;
      const matchIDs = Object.keys(prevRound);

      for (let i = 0; i < matchIDs.length; i += 2) {
        const match1ID = matchIDs[i];
        const nextMatchID = `R${currentRoundIndex + 1}_M${nextMatchIndex}`;

        // For match 1, only the winner (rank 0) advances
        this.nextMatchSeeding.set(match1ID, [nextMatchID]);

        // If there's a second match in the pair
        if (i + 1 < matchIDs.length) {
          const match2ID = matchIDs[i + 1];
          // For match 2, only the winner (rank 0) advances to the same next match
          this.nextMatchSeeding.set(match2ID, [nextMatchID]);
        }

        nextMatchIndex++;
      }

      // Update for the next iteration
      prevRoundMatchCount = matchesInThisRound;
      currentRoundIndex++;
    }

    // Update first round match assignments with real match IDs
    this.updateFirstRoundMatchSeeding();
  }

  /**
   * Update first round match seeding with real match IDs
   */
  protected updateFirstRoundMatchSeeding(): void {
    const firstRound = this.rounds[0];
    const placeholderToRealId: Map<string, string> = new Map();

    // Create mapping from placeholder IDs to real match IDs
    Object.keys(firstRound).forEach((realMatchId, index) => {
      const placeholderId = `R1_M${index}`;
      placeholderToRealId.set(placeholderId, realMatchId);
    });

    // Create new seeding map with real IDs
    const updatedSeeding = new Map<string, string[]>();

    // For each first round match
    Object.keys(firstRound).forEach((matchId, index) => {
      const placeholderId = `R1_M${index}`;
      const nextMatchSeeding = this.nextMatchSeeding.get(placeholderId);

      if (nextMatchSeeding) {
        updatedSeeding.set(matchId, nextMatchSeeding);
      }
    });

    // Copy over any non-first round seedings
    this.nextMatchSeeding.forEach((seeding, matchId) => {
      if (!matchId.startsWith("R1_")) {
        updatedSeeding.set(matchId, seeding);
      }
    });

    this.nextMatchSeeding = updatedSeeding;
  }

  /**
   * Returns final tournament results
   */
  finalResults(): TournamentResults {
    const tournamentResults: TournamentResults = {};

    // Initialize results for all players
    this.tournamentData.players.forEach((playerID: string) => {
      tournamentResults[playerID] = [];
    });

    // Build results based on stored match data
    this.matchResults.forEach((match, matchID) => {
      // For each player in this match
      Object.keys(match.results).forEach((playerID) => {
        if (!tournamentResults[playerID] || playerID.startsWith("TBD_")) {
          return; // Skip if player not found or is a placeholder
        }

        // Add this match result to player's results
        tournamentResults[playerID].push({
          [matchID]: {
            results: match.results[playerID] || [],
            won:
              this.matchRankedPlayers.get(matchID)?.[0] === playerID || false,
          },
        });
      });
    });

    return tournamentResults;
  }

  /**
   * Helper function to get a consistent match key for a set of players
   */
  getMatchKey(players: string[]): string {
    const sortedPlayers = [...players].sort();
    return sortedPlayers.join("|");
  }

  /**
   * Helper method for the Tournament to check if a match is still active
   */
  isMatchActive(matchID: string): boolean {
    return this.activeMatches.has(matchID);
  }
}
