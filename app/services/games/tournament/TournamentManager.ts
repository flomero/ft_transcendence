import { TournamentMember } from "../../../interfaces/games/tournament/TournamentMember";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import { GameModeType } from "../../config/gameModes";
import { TournamentConfigKey } from "../../config/tournamentConfig";
import { Tournament, TournamentStatus } from "./tournament";
import createTournament from "./websocket/createTournament";
import { Database } from "sqlite";
import {
  Round,
  MatchResults,
  GameResult,
  Match,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { createMatch } from "../matchMaking/createMatch";
import { GameOrigin } from "../../../types/games/gameHandler/GameOrigin";

class TournamentManager {
  public tournamentId: string = randomUUID();
  public ownerId: string | undefined; // Make private
  private tournamentMembers: Map<string, TournamentMember> = new Map();
  public tournamentConfigKey: TournamentConfigKey; // Make private
  public gameModeType: GameModeType;
  public tournament: Tournament | undefined;
  public tournamentSize: number;
  public gameManagerIdToTorunGameId: Map<string, string[]> = new Map();
  public db: Database;
  public gameMatches: Map<string, Match> = new Map();

  constructor(
    tournamentConfigKey: TournamentConfigKey,
    userId: string,
    gameModeType: GameModeType,
    tournamentSize: number,
    db: Database,
  ) {
    this.ownerId = userId;
    this.gameModeType = gameModeType;
    this.tournamentConfigKey = tournamentConfigKey;
    this.tournamentSize = tournamentSize;
    this.db = db;

    const newMember: TournamentMember = {
      id: userId,
      status: "joined",
    };
    this.tournamentMembers.set(userId, newMember);
  }

  public setMemberSocket(memberId: string, socket: WebSocket): void {
    if (this.tournamentMembers.has(memberId) === false) {
      console.error(`Member: ${memberId} does not exist`);
      return;
    }
    this.tournamentMembers.get(memberId)!.webSocket = socket;
  }

  public addMember(memberId: string): void {
    if (this.tournamentMembers.has(memberId) === true) {
      console.warn(
        `Member: ${memberId} already exists in tournament: ${this.tournamentId}`,
      );
      return;
    }
    const newMember: TournamentMember = {
      id: memberId,
      status: "joined",
    };
    this.tournamentMembers.set(memberId, newMember);
  }

  public isMemberInTournament(memberId: string): boolean {
    return this.tournamentMembers.has(memberId);
  }

  public removeMemberSave(memberId: string): void {
    if (this.tournamentMembers.has(memberId) === false) {
      console.warn(
        `Member: ${memberId} does not exist in tournament: ${this.tournamentId}`,
      );
      return;
    }
    const member = this.tournamentMembers.get(memberId);
    member?.webSocket?.close();
    this.tournamentMembers.delete(memberId);
    if (
      memberId === this.ownerId &&
      this.tournament?.getStatus() === TournamentStatus.CREATED
    ) {
      this.changeOwner();
    }
  }

  public changeOwner() {
    if (this.tournamentMembers.size > 0) {
      const memberIds = Array.from(this.tournamentMembers.keys());
      this.ownerId = memberIds[0];
      return;
    }
    this.ownerId = undefined;
  }

  public async startTournament(db: Database): Promise<void> {
    if (this.canTournamentBeStarted() === false) {
      throw new Error("[start Tournemant] Tournament cannot be started");
    }

    this.tournament = await createTournament(db, this);
    this.tournament.startTournament();
    await this.generateRound();
  }

  public canTournamentBeStarted(): boolean {
    if (this.isTournamentFull() === false)
      throw new Error("Not enough members to start tournament");
    if (this.tournament?.getStatus() === TournamentStatus.ON_GOING)
      throw new Error("Tournament is already started");
    if (this.tournament?.getStatus() === TournamentStatus.FINISHED)
      throw new Error("Tournament is already finished");
    //    if (this.allMembersAreConnected() === false)
    // put this check of for testing
    //      throw new Error("Not all members are connected");
    return true;
  }

  private async generateRound(): Promise<void> {
    if (this.tournament === undefined)
      return console.error("Tournament is not started");
    const brackets = this.tournament.bracketManager.executeStrategy();
    this.createMatches(brackets);
  }

  private async createMatches(brackets: Round): Promise<void> {
    const bracketKeys = Object.keys(brackets);

    for (let i = 0; i < bracketKeys.length; i++) {
      const bracketKey = bracketKeys[i];
      const bracket = brackets[bracketKey];
      const playersOfMatch = this.getBracketResultsKeysArr(bracket.results);
      this.gameMatches.set(bracketKey, bracket);
      const gameOrigin: GameOrigin = {
        type: "tournament",
        tournament: this,
      };

      const gameManagerId = await createMatch(
        playersOfMatch,
        this.gameModeType,
        this.db,
        gameOrigin,
      );
      this.sendGameManagerIdToPlayersOfMatch(gameManagerId, playersOfMatch);
      this.addToGameManagerIdToTorunGameId(gameManagerId, bracketKey);
    }
  }

  private sendGameManagerIdToPlayersOfMatch(
    gameManagerId: string,
    playersOfMatch: string[],
  ): void {
    for (const player of playersOfMatch) {
      const member = this.tournamentMembers.get(player);
      member?.webSocket?.send(
        JSON.stringify({
          type: "gameManagerId",
          gameManagerId: gameManagerId,
        }),
      );
    }
  }

  private getBracketResultsKeysArr(result: MatchResults): string[] {
    const resultKeys = Object.keys(result);
    const resultKeyArr: string[] = [];

    for (let i = 0; i < resultKeys.length; i++) {
      resultKeyArr.push(resultKeys[i]);
    }
    return resultKeyArr;
  }

  private addToGameManagerIdToTorunGameId(
    gameManagerId: string,
    tournamentGameId: string,
  ): void {
    const existingGameIds =
      this.gameManagerIdToTorunGameId.get(tournamentGameId);
    if (existingGameIds) {
      existingGameIds.push(gameManagerId);
    } else {
      this.gameManagerIdToTorunGameId.set(tournamentGameId, [gameManagerId]);
    }
  }

  public notifyGameCompleted(
    gameManagerId: string,
    gameResult: GameResult,
  ): void {
    const isMatchOver = this.notifyMatchWinnder(gameManagerId, gameResult);

    if (isMatchOver === true) {
      this.notifyBracketManager(gameResult, gameManagerId);
    } else {
      this.createOneGame(gameManagerId);
    }
  }

  private notifyMatchWinnder(
    gameManagerId: string,
    gameResult: GameResult,
  ): boolean {
    const matchId = this.getInGameIdFromGameManagerId(gameManagerId);
    if (matchId === undefined || this.tournament === undefined)
      throw new Error(
        `[notifyMatchWinner] GameManagerId: ${gameManagerId} does not exist`,
      );

    const isMatchOver = this.tournament?.matchWinnerManager.executeStrategy(
      matchId,
      gameResult,
    );
    return isMatchOver;
  }

  private notifyBracketManager(
    gameResult: GameResult,
    gameManagerId: string,
  ): void {
    const matchId = this.getInGameIdFromGameManagerId(gameManagerId);
    if (matchId === undefined || this.tournament === undefined)
      throw new Error(
        `[notifyBracketManager] GameManagerId: ${gameManagerId} does not exist`,
      );

    const isRoundOver = this.tournament?.bracketManager.execute(
      "notifyGameCompleted",
      matchId,
      gameResult,
    );

    if (isRoundOver === true) this.generateRound();
  }

  private getInGameIdFromGameManagerId(
    gameManagerId: string,
  ): string | undefined {
    for (const [
      tournamentGameId,
      gameManagerIds,
    ] of this.gameManagerIdToTorunGameId.entries()) {
      if (gameManagerIds.includes(gameManagerId)) {
        return tournamentGameId;
      }
    }
    return undefined;
  }

  private async createOneGame(gameManagerId: string) {
    const matchId = this.getInGameIdFromGameManagerId(gameManagerId);
    if (matchId === undefined) {
      throw new Error(
        `[craeteMatch] Match with ID ${gameManagerId} does not exist`,
      );
    }
    const matchOptions = this.gameMatches.get(matchId);
    if (matchOptions === undefined) {
      throw new Error(`[createMatch] Match with ID ${matchId} does not exist`);
    }

    const playersOfMatch = this.getBracketResultsKeysArr(matchOptions.results);
    const gameOrigin: GameOrigin = {
      type: "tournament",
      tournament: this,
    };
    const newGameManagerId = await createMatch(
      playersOfMatch,
      this.gameModeType,
      this.db,
      gameOrigin,
    );
    this.sendGameManagerIdToPlayersOfMatch(newGameManagerId, playersOfMatch);
    this.addToGameManagerIdToTorunGameId(newGameManagerId, matchId);
  }

  public allMembersAreConnected(): boolean {
    for (const member of this.tournamentMembers.values()) {
      if (member.webSocket === undefined) {
        // check is ai later
        return false;
      }
    }
    return true;
  }

  public isTournamentFull(): boolean {
    return this.tournamentMembers.size === this.tournamentSize;
  }

  public getTournamentConfigKey(): TournamentConfigKey {
    return this.tournamentConfigKey;
  }

  public getPlayersUUIDs(): string[] {
    return Array.from(this.tournamentMembers.keys());
  }

  public getGameModeType(): GameModeType {
    return this.gameModeType;
  }

  public getTournamentStatus(): TournamentStatus | undefined {
    return this.tournament?.getStatus();
  }

  public getId(): string {
    return this.tournamentId;
  }
}

export default TournamentManager;
