import type { ITournamentBracketGenerator } from "../../types/strategy/ITournamentBracketGenerator";
import type {
  ITournamentMatchWinner,
  MatchData,
} from "../../types/strategy/ITournamentMatchWinner";
import { StrategyManager } from "../strategy/strategyManager";
import type { GameBase } from "../games/gameBase";
import type {
  Match,
  Round,
  TournamentRankings,
  GameResult,
} from "../../types/strategy/ITournamentBracketGenerator";
import type {
  TournamentResults,
  PlayerResults,
} from "../../types/tournament/tournament";

export enum TournamentStatus {
  CREATED,
  ON_GOING,
  FINISHED,
}

export class Tournament {
  // All tournament related data given at creation
  protected tournamentData: Record<string, any>;

  // Strategy managers for bracket generation and match winner determination
  protected bracketManager: StrategyManager<
    ITournamentBracketGenerator,
    "nextRound"
  >;

  protected matchWinnerManager: StrategyManager<
    ITournamentMatchWinner,
    "recordGameResult"
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

    // Initialize bracket generator strategy
    this.bracketManager = new StrategyManager(
      this.tournamentData.bracketType,
      "tournamentBracketGenerator",
      "nextRound",
      [this.tournamentData],
    );

    // Initialize match winner strategy
    this.matchWinnerManager = new StrategyManager(
      this.tournamentData.matchWinnerType,
      "tournamentMatchWinner",
      "recordGameResult",
      [],
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

      // Initialize matches in the match winner strategy
      Object.entries(currentRound).forEach(([matchID, match]) => {
        const playerIDs = Object.keys(match.results);
        // Initialize match in the match winner strategy
        this.matchWinnerManager.execute(
          "initializeMatch",
          matchID,
          playerIDs,
          match.gamesCount,
        );

        console.log(
          `  |->  ${matchID}: ${playerIDs.join(" vs ")} (Best of ${match.gamesCount})`,
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

      // Notify strategies about completed game and check if match is complete
      isMatchComplete = this.notifyGameCompleted(matchID, gameResult);

      if (isMatchComplete) {
        // Get the winner from the match winner strategy
        const winner = this.matchWinnerManager.execute(
          "getMatchWinner",
          matchID,
        );
        // Update the match object with the winner and results
        match.winner = winner;
        match.results = this.matchWinnerManager.execute(
          "getMatchResults",
          matchID,
        );

        console.log(`  ${winner} wins the match in ${gameNum} games!`);
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
   * Notifies the match winner strategy about a completed game and
   * then updates the bracket generator if the match is complete
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

    // First, notify the match winner strategy
    const isMatchComplete = this.matchWinnerManager.execute(
      "recordGameResult",
      matchID,
      gameData,
    );

    // If the match is complete, notify the bracket generator
    if (isMatchComplete) {
      // The bracket generator still needs to know about completed matches
      // for tournament progression
      this.bracketManager.execute("notifyGameCompleted", matchID, gameData);
    }

    return isMatchComplete;
  }

  // Getters & Setters
  getStatus(): TournamentStatus {
    return this.status;
  }

  getResults(): TournamentResults {
    // Now the tournament needs to build results using data from both strategies
    const results: TournamentResults = {};

    // Get all match data from the match winner strategy
    const matchResults = new Map<
      string,
      { winner: string; results: Record<string, number[]> }
    >();
    const matches = this.matchWinnerManager.execute("getMatches");

    matches
      .entries()
      .filter((entry: [string, MatchData]) => entry[1].isComplete)
      .forEach((entry: [string, MatchData]) => {
        matchResults.set(entry[0], {
          winner: entry[1].winner,
          results: entry[1].results,
        });
      });

    // Then create player-focused result objects
    (this.tournamentData.players as string[]).forEach((playerID) => {
      const playerResults: PlayerResults[] = [];

      // Find all matches this player participated in
      matchResults.forEach((match, matchID) => {
        if (match.results[playerID]) {
          playerResults.push({
            [matchID]: {
              results: match.results[playerID],
              won: match.winner === playerID,
            },
          } as PlayerResults);
        }
      });

      results[playerID] = playerResults;
    });

    return results;
  }

  getFinalRankings(): TournamentRankings {
    return this.bracketManager.execute(
      "computeFinalRankings",
      this.getResults(),
    );
  }
}
