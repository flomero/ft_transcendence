import type { ITournamentBracketGenerator } from "../../../types/strategy/ITournamentBracketGenerator";
import type {
  ITournamentMatchWinner,
  MatchData,
} from "../../../types/strategy/ITournamentMatchWinner";
import { StrategyManager } from "../../strategy/strategyManager";
import type { GameBase } from "../../games/gameBase";
import type {
  Match,
  Round,
  TournamentRankings,
  GameResult,
} from "../../../types/strategy/ITournamentBracketGenerator";
import {
  type TournamentResults,
  type PlayerResults,
  type TournamentInfos,
  type RoundInfos,
  MatchInfos,
  PlayerInfos,
  MatchStatus,
  Edge,
} from "../../../types/tournament/tournament";

export enum TournamentStatus {
  CREATED,
  ON_GOING,
  FINISHED,
}
import { TournamentSettings } from "../../../interfaces/games/tournament/TournamentSettings";

const singleEliminationRoundNames: string[] = [
  "Final",
  "1/2 Final",
  "1/4 Final",
  "1/8 Final",
  "1/16 Final",
];

export class Tournament {
  // All tournament related data given at creation
  protected tournamentData: TournamentSettings;

  // Strategy managers for bracket generation and match winner determination
  public bracketManager: StrategyManager<
    ITournamentBracketGenerator,
    "nextRound"
  >;

  public matchWinnerManager: StrategyManager<
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

  // DEBUG
  counter: number = 0;

  constructor(tournamentData: TournamentSettings) {
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
      this.tournamentData.matchWinner,
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

    // DEBUG

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
      console.log(`COUNTER: ${this.counter}`);
      if (++this.counter === 24) {
        console.log(`\n--------------\n`);
        console.log(`Tournament infos after 24 games`);
        const tournamentInfos = this.getCurrentTournamentInfos();
        console.dir(tournamentInfos, { depth: null });
        console.log(`\n--------------\n`);
      }
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

  getCurrentTournamentInfos(): TournamentInfos {
    const completeBracket = this.bracketManager.execute("getCompleteBracket");
    const matchesData: Map<string, MatchData> =
      this.matchWinnerManager.execute("getMatches");

    const roundCount = completeBracket.rounds.length;

    // TMP
    const tournamentID = "0";

    const tournamentInfos: TournamentInfos = {
      id: tournamentID,
      state: this.status,
      playerCount: this.tournamentData.players?.length || 0,
      type: "Single Elimination",
      rounds: Array.from<RoundInfos>(
        // Compute each RoundInfos from bracketRounds & matchWinner matchesData
        completeBracket.rounds.map((round, roundID) => {
          return {
            name: singleEliminationRoundNames[roundCount - (roundID + 1)],
            isCurrent: this.currentRound === round,
            matches: Array.from<MatchInfos>(
              // Compute each MatchInfos from rounds
              Object.entries(round).map(([matchID, match]: [string, Match]) => {
                const matchData = matchesData.get(matchID);
                if (!matchData)
                  return {
                    id: "",
                    players: [],
                    status: MatchStatus.NOT_STARTED,
                  };

                const playerIDs: string[] = matchData.playerIDs || [];
                const playersInfos: PlayerInfos[] =
                  // Compute each PlayerInfos from matchData
                  playerIDs.map((playerID) => {
                    return {
                      id: playerID,
                      score: matchData.results[playerID] || [],
                      winCount: matchData.winCounts.get(playerID) || 0,
                      isReady: roundID === 0, // Other rounds will be propagated from seeding
                    };
                  });

                const winCounts: [number, number] = [
                  matchData.winCounts.get(playerIDs[0]) || 0,
                  matchData.winCounts.get(playerIDs[1]) || 0,
                ];

                return {
                  id: matchID,
                  players: playersInfos,
                  gameWinners: Array.from<number>(
                    matchData.results[playerIDs[0]].map((p0rank) =>
                      p0rank === 1 ? 0 : 1,
                    ),
                  ),
                  leadPlayer:
                    winCounts[0] >= winCounts[1]
                      ? winCounts[0] === winCounts[1]
                        ? -1
                        : 0
                      : 1,
                  currentGame: winCounts.reduce((prev, curr) => prev + curr),
                  status: matchData.isComplete
                    ? MatchStatus.COMPLETED
                    : MatchStatus.NOT_STARTED,
                };
              }),
            ),
          };
        }),
      ),

      seeding: Array.from<Edge>(
        Array.from(completeBracket.seeding.entries())
          .filter(([, toList]) => toList.length > 0)
          .map(([from, toList]: [string, string[]]) => [
            tournamentID,
            from,
            toList[0],
          ]),
      ),
    };

    const matchesMap = new Map<string, MatchInfos>();
    tournamentInfos.rounds.forEach((round) => {
      round.matches.forEach((match) => matchesMap.set(match.id, match));
    });

    let counter: number = 0;
    (tournamentInfos.seeding || []).forEach(
      ([_, fromMatchID, toMatchID]: Edge) => {
        const fromMatch = matchesMap.get(fromMatchID);
        const toMatch = matchesMap.get(toMatchID);

        if (!fromMatch || !toMatch) return;
        toMatch.players[counter].isReady =
          fromMatch.status === MatchStatus.COMPLETED;

        counter = (counter + 1) % 2;
      },
    );

    return tournamentInfos;
  }
}
