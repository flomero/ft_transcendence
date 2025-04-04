import { ITournamentBracketGenerator } from "../../types/strategy/ITournamentBracketGenerator";
import { StrategyManager } from "../strategy/strategyManager";
import { type GameBase } from "../games/gameBase";
import { RNG } from "../games/rng";
import {
  type Match,
  type Round,
} from "../../types/strategy/ITournamentBracketGenerator";

export enum TournamentStatus {
  CREATED,
  ON_GOING,
  FINISHED,
}

export type PlayerResults = {
  [matchID: string]: {
    won: boolean;
    results: number[];
  };
};

export type TournamentResults = {
  [playerID: string]: PlayerResults[];
};

export type CombinedResults = {
  [playerID: string]: {
    totalWins: number;
    totalScore: number;
  };
};

export class Tournament {
  // All tournament related data given at creation
  protected tournamentData: Record<string, any>;

  protected bracketManager: StrategyManager<
    ITournamentBracketGenerator,
    "nextRound"
  >;

  // Maps matchID to its game instances
  protected currentGames: Map<string, GameBase[]> = new Map<
    string,
    GameBase[]
  >();

  // The current round being played
  protected currentRound: Round = {};

  // Track which matches have been completed
  protected completedMatches: Set<string> = new Set<string>();

  protected status: TournamentStatus = TournamentStatus.CREATED;
  protected tournamentResults: TournamentResults = {};

  constructor(tournamentData: Record<string, any>) {
    this.tournamentData = tournamentData;

    this.bracketManager = new StrategyManager(
      this.tournamentData.bracketType,
      "tournamentBracketGenerator",
      "nextRound",
      [this.tournamentData],
    );
  }

  protected canAdvanceRound(): boolean {
    // Check if all matches in the current round are completed
    return Object.keys(this.currentRound).every((matchID) =>
      this.completedMatches.has(matchID),
    );
  }

  startTournament(): void {
    this.status = TournamentStatus.ON_GOING;

    // Start tournament with no previous round results
    let currentRound = this.bracketManager.executeStrategy();
    let roundNumber = 1;

    // Continue until there are no more matches to play
    while (Object.keys(currentRound).length > 0) {
      this.currentRound = currentRound;
      this.completedMatches.clear();

      console.log(`\n ---- ROUND ${roundNumber} ----`);
      console.log(`Round ${roundNumber} matches:`);

      Object.entries(currentRound).forEach(([matchID, match]) => {
        console.log(
          `  |->  ${matchID}: ${Object.keys(match.results).join(" vs ")} (Best of ${match.gamesCount})`,
        );
      });

      // Simulate playing all games in this round
      this.simulateRound(currentRound);

      // Get matches for the next round
      currentRound = this.bracketManager.executeStrategy(this.currentRound);
      roundNumber++;
    }

    console.log("\n ---- TOURNAMENT COMPLETED ----");
    this.status = TournamentStatus.FINISHED;

    this.tournamentResults = this.getResults();
  }

  /**
   * Simulates a round by playing all games in each match.
   * Handles "best of X" logic for each match.
   *
   * @param round The current round with matches to simulate.
   */
  simulateRound(round: Round): void {
    // For each match in the round
    Object.entries(round).forEach(([matchID, match]) => {
      console.log(`\nPlaying match ${matchID} (Best of ${match.gamesCount}):`);
      this.simulateMatch(matchID, match);
    });
  }

  simulateMatch(matchID: string, match: Match): void {
    const rng = new RNG();

    // Determine how many games to play (best of X)
    const maxGames = match.gamesCount;
    const players = Object.keys(match.results);

    // Keep track of wins per player
    const winCounts: Map<string, number> = new Map();
    players.forEach((player) => winCounts.set(player, 0));

    // Play games until a player has enough wins or all games are played
    for (let gameNum = 1; gameNum <= maxGames; gameNum++) {
      // Create a copy of the players array and shuffle it for finish order
      const gameResult = rng.randomArray([...players]);

      // Record the position for each player (1-based index)
      gameResult.forEach((playerID, index) => {
        // Add the position (1-based) to the player's results
        const position = index + 1;
        match.results[playerID].push(position);
      });

      // Format for console output
      const resultString = gameResult.join("|");
      console.log(`  Game ${gameNum}: ${resultString}`);

      // Update win counts (first player in result is the winner)
      const winner = gameResult[0];
      match.winner = winner;
      const currentWins = winCounts.get(winner) || 0;
      winCounts.set(winner, currentWins + 1);

      // Check if a player has enough wins to clinch the match
      const requiredWins = Math.ceil(maxGames / 2); // Majority needed to win
      if (currentWins + 1 >= requiredWins) {
        console.log(`  ${winner} wins the match in ${gameNum} games!`);
        break; // No need to play more games
      }
    }

    // Mark this match as completed
    this.completedMatches.add(matchID);
  }

  endOfMatchCheck(match: Match) {
    // TODO: Move Best of X check here
  }

  // Getters & Setters
  getStatus(): TournamentStatus {
    return this.status;
  }

  getResults(): TournamentResults {
    return this.bracketManager.execute("finalResults");
  }

  getOverallResults(): CombinedResults {
    const finalResults = this.bracketManager.execute("finalResults");
    const overallResults: CombinedResults = {};

    Object.entries(finalResults).forEach((entry: [string, PlayerResults[]]) => {
      let totalScore = 0;
      let totalWins = 0;

      Object.entries(entry[1]).forEach(
        (matchResultEntry: [string, PlayerResults]) => {
          Object.values(matchResultEntry[1]).forEach(
            (playerResult: { won: boolean; results: number[] }) => {
              totalWins += playerResult.won ? 1 : 0;
              totalScore += playerResult.results.reduce(
                (prev, curr) => prev + curr,
              );
            },
          );
        },
      );

      overallResults[entry[0]] = {
        totalScore: totalScore,
        totalWins: totalWins,
      };
    });

    return overallResults;
  }
}
