import type { TournamentMember } from "../../../interfaces/games/tournament/TournamentMember";
import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import type { GameModeType } from "../../config/gameModes";
import type { TournamentConfigKey } from "../../config/tournamentConfig";
import { type Tournament, TournamentStatus } from "./tournament";
import createTournament from "./websocket/createTournament";
import type { Database } from "sqlite";
import type {
  Round,
  MatchResults,
  GameResult,
  Match,
} from "../../../types/strategy/ITournamentBracketGenerator";
import { createMatch } from "../matchMaking/createMatch";
import type { GameOrigin } from "../../../types/games/gameHandler/GameOrigin";
import aiOpponents from "../aiOpponent/aiOpponents";
import { FastifyInstance } from "fastify";
import {
  type TournamentInfos,
  MatchStatus,
} from "../../../types/tournament/tournament";

class TournamentManager {
  public tournamentId: string = randomUUID();
  public ownerId: string;
  private tournamentMembers: Map<string, TournamentMember> = new Map();
  public tournamentConfigKey: TournamentConfigKey;
  public gameModeType: GameModeType;
  public tournament: Tournament | undefined;
  public tournamentSize: number;
  public gameManagerIdToTorunGameId: Map<string, string[]> = new Map();
  public fastify: FastifyInstance;
  public gameMatches: Map<string, Match> = new Map();
  private static readonly PlayerType = {
    PLAYER: 0,
    AI: 1,
  } as const;

  constructor(
    tournamentConfigKey: TournamentConfigKey,
    userId: string,
    gameModeType: GameModeType,
    tournamentSize: number,
    fastify: FastifyInstance,
  ) {
    this.ownerId = userId;
    this.gameModeType = gameModeType;
    this.tournamentConfigKey = tournamentConfigKey;
    this.tournamentSize = tournamentSize;
    this.fastify = fastify;

    const newMember: TournamentMember = {
      id: userId,
      status: "joined",
      isAI: false,
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

  public sendMessageToAll(message: string): void {
    for (const member of this.tournamentMembers.values()) {
      if (member.webSocket) {
        member.webSocket.send(message);
      }
    }
  }

  public addMember(memberId: string): void {
    if (this.tournamentMembers.has(memberId) === true) {
      // console.warn(
      //   `Member: ${memberId} already exists in tournament: ${this.tournamentId}`,
      // );
      return;
    }
    const newMember: TournamentMember = {
      id: memberId,
      status: "joined",
      isAI: false,
    };
    this.tournamentMembers.set(memberId, newMember);
    this.sendMessageToAll(
      JSON.stringify({
        type: "update",
      }),
    );
  }

  public addAiOpponent(memberId: string): void {
    this.canAIOpponentBeAdded(memberId);
    const aiId = this.getNumberOfAiOpponents();
    const newAiOpponent: TournamentMember = {
      id: aiId.toString(),
      status: "joined",
      isAI: true,
    };
    this.tournamentMembers.set(aiId.toString(), newAiOpponent);
    this.sendMessageToAll(
      JSON.stringify({
        type: "update",
      }),
    );
  }

  private canAIOpponentBeAdded(memberId: string): void {
    if (memberId !== this.ownerId) {
      throw new Error("[addAiOpponent] Only the owner can add AI opponents");
    }
    if (this.tournamentMembers.size >= this.tournamentSize) {
      throw new Error("[addAiOpponent] Tournament is already full");
    }
    if (this.getNumberOfAiOpponents() >= aiOpponents.length)
      throw new Error("[addAiOpponent] No more AI opponents available");
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
    this.sendMessageToAll(
      JSON.stringify({
        type: "update",
      }),
    );
  }

  public changeOwner() {
    if (this.tournamentMembers.size > 0) {
      const memberIds = Array.from(this.tournamentMembers.keys());
      this.ownerId = memberIds[0];
      return;
    }
  }

  public async startTournament(db: Database): Promise<void> {
    if (this.canTournamentBeStarted() === false) {
      throw new Error("[startTournament] Tournament cannot be started");
    }

    this.tournament = await createTournament(db, this);
    this.sendMessageToAll(
      JSON.stringify({
        type: "update",
      }),
    );

    const sleep = (ms: number): Promise<void> =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // Sleep for 20 seconds before starting tournament.
    await sleep(20000);

    this.tournament.startTournament();
    await this.generateRound();
    // this.sendMessageToAll(
    //   JSON.stringify({
    //     type: "update",
    //   }),
    // );
  }

  public canTournamentBeStarted(): boolean {
    if (this.isTournamentFull() === false) return false;
    if (this.tournament?.getStatus() === TournamentStatus.ON_GOING)
      return false;
    if (this.tournament?.getStatus() === TournamentStatus.FINISHED)
      return false;
    if (this.allMembersAreConnected() === false) return false;
    return true;
  }

  private async generateRound(): Promise<void> {
    if (this.tournament === undefined)
      return console.error("Tournament is not started");
    const brackets = this.tournament.bracketManager.executeStrategy();
    this.createMatches(brackets);
  }

  private async createMatches(brackets: Round): Promise<void> {
    Object.entries(brackets).forEach(([matchID, match]: [string, Match]) => {
      this.tournament?.matchWinnerManager.execute(
        "initializeMatch",
        matchID,
        Object.keys(match.results),
        match.gamesCount,
      );
    });

    const bracketKeys = Object.keys(brackets);
    const { PLAYER, AI } = TournamentManager.PlayerType;

    for (let i = 0; i < bracketKeys.length; i++) {
      const bracketKey = bracketKeys[i];
      const bracket = brackets[bracketKey];
      const bracketKeysArr = this.getBracketResultsKeysArr(bracket.results);
      const playersAndAis = this.dividePlayersAndAIs(bracketKeysArr);
      this.gameMatches.set(bracketKey, bracket);
      const gameOrigin: GameOrigin = {
        type: "tournament",
        tournament: this,
      };

      const gameManagerId = await createMatch(
        playersAndAis[PLAYER],
        this.gameModeType,
        this.fastify,
        gameOrigin,
        playersAndAis[AI],
      );
      this.sendGameManagerIdToPlayersOfMatch(gameManagerId, playersAndAis[0]);
      this.addToGameManagerIdToTourunGameId(gameManagerId, bracketKey);
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

  /**
   * Divides the players and AIs into two arrays
   * @param playersAndAis - Array of player and AI ids
   * @returns - Array of two arrays, first array contains player ids, second array contains AI ids
   */
  private dividePlayersAndAIs(playersAndAis: string[]): string[][] {
    // 0 beeing player | 1 AIs
    const { PLAYER, AI } = TournamentManager.PlayerType;
    const dividedPlayersAndAIs: string[][] = [[], []];
    for (let i = 0; i < playersAndAis.length; i++) {
      const playerOrAI = this.tournamentMembers.get(playersAndAis[i]);

      if (playerOrAI?.isAI === false)
        dividedPlayersAndAIs[PLAYER].push(playerOrAI.id);
      else if (playerOrAI?.isAI === true)
        dividedPlayersAndAIs[AI].push(playerOrAI.id);
    }
    return dividedPlayersAndAIs;
  }

  private getBracketResultsKeysArr(result: MatchResults): string[] {
    const resultKeys = Object.keys(result);
    const resultKeyArr: string[] = [];

    for (let i = 0; i < resultKeys.length; i++) {
      resultKeyArr.push(resultKeys[i]);
    }
    return resultKeyArr;
  }

  private addToGameManagerIdToTourunGameId(
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

    console.log(`Game finished: ${gameManagerId}`);
    console.dir(gameResult, { depth: null });

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

    console.log(`matchWinner notif: ${matchId}`);

    const isMatchOver = this.tournament?.matchWinnerManager.executeStrategy(
      matchId,
      gameResult,
    );
    console.log(`isMatchOver? ${isMatchOver}`);
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
    console.log(`isRoundOver? ${isRoundOver}`);

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
    const { PLAYER, AI } = TournamentManager.PlayerType;
    if (matchId === undefined) {
      throw new Error(
        `[craeteMatch] Match with ID ${gameManagerId} does not exist`,
      );
    }
    const matchOptions = this.gameMatches.get(matchId);
    if (matchOptions === undefined) {
      throw new Error(`[createMatch] Match with ID ${matchId} does not exist`);
    }

    const resultKeys = this.getBracketResultsKeysArr(matchOptions.results);
    const playersAndAis = this.dividePlayersAndAIs(resultKeys);
    const gameOrigin: GameOrigin = {
      type: "tournament",
      tournament: this,
    };
    const newGameManagerId = await createMatch(
      playersAndAis[PLAYER],
      this.gameModeType,
      this.fastify,
      gameOrigin,
      playersAndAis[AI],
    );
    this.sendGameManagerIdToPlayersOfMatch(
      newGameManagerId,
      playersAndAis[PLAYER],
    );
    this.addToGameManagerIdToTourunGameId(newGameManagerId, matchId);
  }

  public allMembersAreConnected(): boolean {
    for (const member of this.tournamentMembers.values()) {
      if (member.webSocket === undefined && member.isAI === false) return false;
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

  public getNumberOfAiOpponents(): number {
    let numberOfAiOpponents = 0;
    for (const member of this.tournamentMembers.values()) {
      if (member.isAI === true) numberOfAiOpponents++;
    }
    return numberOfAiOpponents;
  }

  public getCurrentTournamentInfos(): TournamentInfos | undefined {
    if (!this.tournament) return;

    const tournamentInfos = this.tournament.getCurrentTournamentInfos();

    tournamentInfos.rounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (match.status === MatchStatus.NOT_STARTED) return;
        const gameManagerIds =
          this.gameManagerIdToTorunGameId.get(match.id) || [];
        match.gameIDs = gameManagerIds;
      });
    });

    return tournamentInfos;
  }
}

export default TournamentManager;
