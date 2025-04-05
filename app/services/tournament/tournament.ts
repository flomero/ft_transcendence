import { ITournamentBracketGenerator } from "../../types/strategy/ITournamentBracketGenerator";
import { StrategyManager } from "../strategy/strategyManager";
import { type GameBase } from "../games/gameBase";
import {
  type Match,
  type Round,
  type GameResult,
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
      currentRound = this.bracketManager.executeStrategy();
      roundNumber++;
    }

    console.log("\n ---- TOURNAMENT COMPLETED ----");
    this.status = TournamentStatus.FINISHED;

    this.tournamentResults = this.getResults();
  }

  /**
   * Simulates a round by playing all games in each match.
   */
  simulateRound(round: Round): void {
    // For each match in the round
    Object.entries(round).forEach(([matchID, match]) => {
      console.log(`\nPlaying match ${matchID} (Best of ${match.gamesCount}):`);
      this.simulateMatch(matchID, match);
    });
  }

  simulateMatch(matchID: string, match: Match): void {
    const players = Object.keys(match.results);

    // Play games until strategy determines the match is complete
    let gameNum = 1;
    let isMatchComplete = false;

    while (!isMatchComplete && gameNum <= match.gamesCount) {
      // Simulate game result (random finish order of players)
      const gameResult = this.simulateGame(players);

      // Format for console output
      const resultString = gameResult.join("|");
      console.log(`  Game ${gameNum}: ${resultString}`);

      // Notify strategy about completed game and check if match is complete
      isMatchComplete = this.notifyGameCompleted(matchID, gameResult);

      if (isMatchComplete) {
        console.log(`  ${match.winner} wins the match in ${gameNum} games!`);
      }

      gameNum++;
    }

    // Mark this match as completed
    this.completedMatches.add(matchID);
  }

  /**
   * Simulates a single game and returns the finish order of players
   */
  protected simulateGame(players: string[]): string[] {
    // Create a copy of the players array and generate a random finish order
    // In a real implementation, this would be the actual game result
    return [...players].sort(() => Math.random() - 0.5);
  }

  /**
   * Notifies the strategy about a completed game and returns whether the match is complete
   */
  protected notifyGameCompleted(
    matchID: string,
    gameResult: string[],
  ): boolean {
    // Convert the player order array into the GameResult format
    // GameResult maps player IDs to their position (1-based index)
    const gameData: GameResult = {};

    gameResult.forEach((playerID, index) => {
      // Position is 1-based (first place = 1, second place = 2, etc.)
      gameData[playerID] = index + 1;
    });

    // Pass the match ID and formatted game result to the strategy
    return this.bracketManager.execute(
      "notifyGameCompleted",
      matchID,
      gameData,
    );
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
    });

    return overallResults;
  }
}
