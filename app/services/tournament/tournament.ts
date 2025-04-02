import { ITournamentBracketGenerator } from "../../types/strategy/ITournamentBracketGenerator";
import { StrategyManager } from "../strategy/strategyManager";
import { type GameBase, GameStatus } from "../games/gameBase";
import {
  RoundMatches,
  MatchPlayers,
  MatchResult,
  PlayerResult,
  RoundResult,
} from "../../types/strategy/ITournamentBracketGenerator";
import { RNG } from "../games/rng";

export enum TournamentStatus {
  CREATED,
  ON_GOING,
  FINISHED,
}

export type SingleMatchResult = Array<[string, number]>;
export type TournamentResult = Map<string, SingleMatchResult>;

export class Tournament {
  // All tournament related data given at creation
  protected tournamentData: Record<string, any>;

  protected bracketManager: StrategyManager<
    ITournamentBracketGenerator,
    "nextRound"
  >;
  // Matches the gameID to the Players userID
  protected currentRound: Map<string, Array<string>> = new Map<
    string,
    Array<string>
  >();
  // Matches the gameID to the Game instance
  protected currentRoundGames: Map<string, GameBase> = new Map<
    string,
    GameBase
  >();

  protected status: TournamentStatus = TournamentStatus.CREATED;

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
    return Array.from(this.currentRoundGames.values()).every(
      (game) => game.getStatus() === GameStatus.FINISHED,
    );
  }

  startTournament(): void {
    this.status = TournamentStatus.ON_GOING;

    // Start with empty results for the first round
    let lastRoundResults: any[] = [];
    let roundMatches = this.bracketManager.executeStrategy(lastRoundResults);
    let roundNumber = 1;

    // Continue until there are no more matches to play
    while (roundMatches.length > 0) {
      console.log(`\n ---- ROUND ${roundNumber} ----`);
      console.log(`Round ${roundNumber} matches:`);

      roundMatches.forEach((match) => {
        console.log(
          `  |->  ${match.reduce((prev, curr) => prev + " vs " + curr)}`,
        );
      });

      // Simulate results for the current round
      const roundResults = this.simulateRound(roundMatches);
      console.log(`Round ${roundNumber} results:`);
      console.dir(roundResults);

      // Get matches for the next round
      lastRoundResults = roundResults;
      roundMatches = this.bracketManager.executeStrategy(lastRoundResults);
      roundNumber++;
    }

    console.log("\n ---- TOURNAMENT COMPLETED ----");
    this.status = TournamentStatus.FINISHED;

    // You might want to display final standings or tournament statistics here
    console.log("All rounds completed. Tournament ended.");
  }

  /**
   * Simulates a round by generating a random result for each player in each match.
   * Uses the RNG class to generate random scores.
   *
   * @param roundMatches The matches for the current round.
   * @returns The simulated results for the round.
   */
  simulateRound(roundMatches: RoundMatches): RoundResult {
    const rng = new RNG();
    // For each match, shuffle the players and assign ranking from 1 to k.
    const roundResults: RoundResult = roundMatches.map(
      (match: MatchPlayers): MatchResult => {
        // Create a copy of the match array and shuffle it.
        const shuffledPlayers = rng.randomArray(match.slice());
        return shuffledPlayers.map(
          (playerId: string, index: number): PlayerResult => ({
            id: playerId,
            result: index + 1, // Ranking: 1st, 2nd, etc.
          }),
        );
      },
    );
    return roundResults;
  }

  // Getters & Setters
  getStatus(): TournamentStatus {
    return this.status;
  }

  getResults(): TournamentResult {
    return this.bracketManager.execute("finalResults");
  }
}
