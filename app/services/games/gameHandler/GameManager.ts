import { randomUUID } from "node:crypto";
import type { GameBase } from "../gameBase";
import { GameStatus } from "../../../types/games/gameBaseState";
import type Player from "../../../interfaces/games/gameHandler/Player";
import { WebSocket } from "ws";
import gameLoop from "./gameLoop";
import type {
  GameMessage,
  ServerMessage,
} from "../../../types/games/userInput";
import { PongAIOpponent } from "../pong/pongAIOpponent";
import aiLoop from "./aiLoop";
import { RNG } from "../rng";
import saveGameResultInDb from "./saveGameResultInDb";
import type { GameOrigin } from "../../../types/games/gameHandler/GameOrigin";
import terminateGame from "./terminateGame";
import { GameResult } from "../../../types/strategy/ITournamentBracketGenerator";
import { PongMinimalGameState } from "../../../types/games/pong/gameState";
import { FastifyInstance } from "fastify";
import { fastifyInstance } from "../../../app";
import { getLobby } from "../lobby/lobbyWebsocket/getLobby";
import { removeMemberFromLobby } from "../lobby/leave/leaveLobbyHandler";

class GameManager {
  private id: string = randomUUID();
  gameOrigin: GameOrigin | undefined;
  private isShuffled = false;
  game: GameBase;
  players: Map<string, Player> = new Map();
  aiOpponents: Map<string, PongAIOpponent> = new Map();
  playerIdReferenceTable: Array<string> = [];

  constructor(game: GameBase, gameOrigin?: GameOrigin) {
    this.game = game;
    this.gameOrigin = gameOrigin;
  }

  public addPlayer(userId: string): void {
    if (this.game.getStatus() === GameStatus.RUNNING) {
      console.error("Game is already running");
      return;
    }

    const newPlayer = {
      id: -1,
      playerUUID: userId,
      leftGame: false,
    };
    this.players.set(userId, newPlayer);
    this.playerIdReferenceTable.push(userId);
  }

  public addAiOpponent(aiOpponentId: string): void {
    if (this.game.getStatus() === GameStatus.RUNNING) {
      console.error("Game is already running");
      return;
    }

    const newAiOpponent = new PongAIOpponent(this.game, {
      playerId: -1,
      strategyName: "foresight",
    });
    this.aiOpponents.set(aiOpponentId, newAiOpponent);
    this.playerIdReferenceTable.push(aiOpponentId);
  }

  public hasPlayer(userId: string): boolean {
    if (this.players.get(userId)?.leftGame === false) return true;
    return false;
  }

  public sendMessageToPlayer(userId: string, type: string, data: string): void {
    const player = this.players.get(userId);
    if (player === undefined) {
      throw new Error("Player not found");
    }
    if (player.ws !== undefined) {
      player.ws.send(JSON.stringify({ type: type, data: data }));
    }
  }

  public sendMessageToAll(message: ServerMessage): void {
    for (const player of this.players.values()) {
      if (player.ws !== undefined) {
        player.ws.send(JSON.stringify(message));
      }
    }
  }

  public getReferenceTable(): string[] {
    return this.playerIdReferenceTable;
  }
  public addSocketToPlayer(userId: string, ws: WebSocket): void {
    const player = this.players.get(userId);
    if (player === undefined) {
      throw new Error("[addSocketToPlayer] Player not found");
    }
    player.ws = ws;
    this.clearPossibleTimeOut(player);
  }

  private clearPossibleTimeOut(player: Player): void {
    if (player.timeOut) {
      clearTimeout(player.timeOut);
    }
  }

  public allPlayersAreConnected(): boolean {
    for (const player of this.players.values()) {
      if (player.ws === undefined) {
        return false;
      }
    }
    return true;
  }

  public removeAllPlayers(): void {
    for (const player of this.players.values()) {
      if (player.ws !== undefined) {
        player.ws.close();
      }
    }
    this.players.clear();
    this.playerIdReferenceTable = [];
  }

  public async startGame(fastify: FastifyInstance): Promise<void> {
    if (this.game.getStatus() !== GameStatus.CREATED) return;

    this.addIngameIdToPlayerAndAiOpponent();
    this.game.startGame();
    this.startGameAndAiLoop(fastify);
  }

  public shuffleReferenceTable(): void {
    if (
      this.isShuffled === true &&
      this.gameStatus() === GameStatus.RUNNING &&
      this.gameOrigin?.type === "tournament"
    )
      return;
    fastifyInstance.log.debug("Shuffling playerIdReferenceTable");
    const tmpRng = new RNG();
    this.playerIdReferenceTable = tmpRng.randomArray(
      this.playerIdReferenceTable,
    );
    this.isShuffled = true;
  }

  private async startGameAndAiLoop(fastify: FastifyInstance): Promise<void> {
    if (this.game.getStatus() === GameStatus.RUNNING) {
      gameLoop(this.id, fastify).then(async () => {
        await saveGameResultInDb(this, fastify.sqlite);
        this.handleGameCompletion();
        terminateGame(this);
      });
      aiLoop(this.id);
    }
  }

  private addIngameIdToPlayerAndAiOpponent(): void {
    for (let i = 0; i < this.playerIdReferenceTable.length; i++) {
      const playerOrAiId = this.playerIdReferenceTable[i];

      const aiOpponents = this.aiOpponents.get(playerOrAiId);
      if (aiOpponents) {
        aiOpponents.setPlayerId(i);
      }

      const player = this.players.get(playerOrAiId);
      if (player) {
        player.id = i;
      }
    }
  }

  private handleGameCompletion(): void {
    if (this.gameOrigin?.type === "lobby") {
      this.gameOrigin.lobby.setStateLobby = "open";
    }
    if (this.gameOrigin?.type === "tournament") {
      const gameResult = this.createGameResult();
      this.gameOrigin.tournament.notifyGameCompleted(this.id, gameResult);
    }
  }

  private createGameResult(): GameResult {
    const result = this.game.getResults();
    const gameResult: GameResult = {};

    for (let i = 0; i < result.length; i++) {
      const playerId = this.playerIdReferenceTable[i];
      gameResult[playerId] = result[i];
    }
    return gameResult;
  }

  public removeNotConnectedPlayers(): void {
    for (const player of this.players.values()) {
      if (player.ws === undefined || player.ws.readyState !== WebSocket.OPEN) {
        this.players.delete(player.playerUUID);
      }
    }
  }

  public disconnectAllPlayers(): void {
    for (const player of this.players.values()) {
      if (player.ws !== undefined) {
        player.ws.close(1001, "Game terminated");
      }
    }
  }

  public disqualifyNotConnectedPlayers(): void {
    for (const player of this.players.values()) {
      if (player.ws === undefined || player.ws.readyState !== WebSocket.OPEN) {
        this.game.eliminate(player.id);
      }
    }
  }

  public leaveGame(playerId: string): void {
    const player = this.players.get(playerId);
    if (player === undefined) {
      return console.error("[leaveGame] Player not found");
    }

    if (this.game.getStatus() === GameStatus.RUNNING) {
      this.disqualifyPlayer(playerId);
      player.leftGame = true;
    }
    if (this.gameOrigin?.type === "lobby") {
      const lobby = getLobby(this.gameOrigin.lobby.getLobbyId);
      removeMemberFromLobby(lobby.getLobbyId, playerId);
    }
  }

  public disqualifyPlayer(playerId: string): void {
    const player = this.players.get(playerId);
    if (player === undefined) {
      throw new Error("[disqualifyPlayer] Player not found");
    }

    if (this.game.getStatus() === GameStatus.RUNNING)
      this.game.eliminate(player.id);
  }

  public removePlayerSocket(playerId: string): void {
    const player = this.players.get(playerId);
    if (player === undefined) {
      return console.error("[removePlayerSocket] Player not found");
    }
    player.ws = undefined;
  }

  public getPlayerSize() {
    return this.players.size + this.aiOpponents.size;
  }

  public getId() {
    return this.id;
  }

  public getGame() {
    return this.game;
  }

  public getScores(): number[] {
    return this.game.getScores();
  }

  public getAiIdsAsArray() {
    return Array.from(this.aiOpponents.keys());
  }

  public connectedNumberOfPlayersInGame() {
    let count = 0;
    for (const player of this.players.values()) {
      if (player.ws !== undefined && player.ws.readyState === WebSocket.OPEN) {
        count++;
      }
    }
    return count + this.aiOpponents.size;
  }

  public isUserConnected(userId: string): boolean {
    const player = this.players.get(userId);
    if (player === undefined) {
      return false;
    } else if (
      player.ws === undefined ||
      player.ws.readyState !== WebSocket.OPEN
    ) {
      return false;
    }
    return true;
  }

  public getPlayer(playerId: string) {
    if (!this.players.has(playerId)) {
      throw new Error("[getPlayer] Player not found");
    }
    return this.players.get(playerId);
  }

  public getResults() {
    return this.game.getResults();
  }

  public gameStatus(): GameStatus {
    return this.game.getStatus();
  }

  public handleAction(data: GameMessage): void {
    this.game.handleAction(data.options);
  }

  public getPlayersAsArray(): Player[] {
    return Array.from(this.players.values());
  }

  public justAisInGame(): boolean {
    if (this.players.size === 0 && this.aiOpponents.size > 0) {
      return true;
    }
    return false;
  }

  public getStateSnapshot(): PongMinimalGameState {
    return this.game.getStateSnapshot() as PongMinimalGameState;
  }

  public setPlayerTimeout(playerId: string, timeOut: NodeJS.Timeout): void {
    const player = this.players.get(playerId);
    if (player === undefined) {
      return console.error("[setTimeOut] Player not found");
    }
    player.timeOut = timeOut;
  }
}

export default GameManager;
