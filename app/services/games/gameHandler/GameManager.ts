import { randomUUID } from "node:crypto";
import { type GameBase, GameStatus } from "../gameBase";
import type Player from "../../../interfaces/games/gameHandler/Player";
import type { WebSocket } from "ws";
import gameLoop from "./gameLoop";
import type GameMessage from "../../../interfaces/games/gameHandler/GameMessage";
import { PongAIOpponent } from "../pong/pongAIOpponent";
import aiLoop from "./aiLoop";
import { Database } from "sqlite";

class GameManager {
  private id: string = randomUUID();
  game: GameBase;
  players: Map<string, Player> = new Map();
  aiOpponent: Map<string, PongAIOpponent> = new Map();
  playerIdReferenceTable: Array<string> = [];

  constructor(game: GameBase) {
    this.game = game;
  }

  public addPlayer(userId: string): void {
    if (this.game.getStatus() === GameStatus.RUNNING) {
      console.error("Game is already running");
      return;
    }

    const newPlayer = {
      id: -1,
      playerUUID: userId,
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
      strategyName: "improvedNaive",
    });
    this.aiOpponent.set(aiOpponentId, newAiOpponent);
    this.playerIdReferenceTable.push(aiOpponentId);
  }

  public hasPlayer(userId: string): boolean {
    return this.players.has(userId);
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

  public sendMessageToAll(type: string, data: string): void {
    for (const player of this.players.values()) {
      if (player.ws !== undefined) {
        player.ws.send(JSON.stringify({ type: type, data: data }));
      }
    }
  }

  public addSocketToPlayer(userId: string, ws: WebSocket): void {
    const player = this.players.get(userId);
    if (player === undefined) {
      throw new Error("Player not found");
    }
    player.ws = ws;
  }

  public allPlayersAreConnected(): boolean {
    for (const player of this.players.values()) {
      if (player.ws === undefined) {
        return false;
      }
    }
    return true;
  }

  public async startGame(db: Database): Promise<void> {
    if (this.allPlayersAreConnected() === false) {
      throw new Error("Not all players are connected");
    }

    this.game.startGame();
    if (this.game.getStatus() === GameStatus.RUNNING) {
      this.addIngameIdToPlayerAndAiOpponent();
      await gameLoop(this.id, db);
      await aiLoop(this.id);
    }
  }

  private addIngameIdToPlayerAndAiOpponent(): void {
    for (let i = 0; i < this.playerIdReferenceTable.length; i++) {
      const playerOrAiId = this.playerIdReferenceTable[i];

      const aiOpponent = this.aiOpponent.get(playerOrAiId);
      if (aiOpponent) {
        aiOpponent.setPlayerId(i);
      }

      const player = this.players.get(playerOrAiId);
      if (player) {
        player.id = i;
      }
    }
  }

  public get getId() {
    return this.id;
  }

  public get getGame() {
    return this.game;
  }

  public get getScores(): number[] {
    return this.game.getScores();
  }

  public get getAiIdsAsArray() {
    return Array.from(this.aiOpponent.keys());
  }

  public getPlayer(playerId: string) {
    if (!this.players.has(playerId)) {
      throw new Error("Player not found");
    }
    return this.players.get(playerId);
  }

  public handleAction(data: GameMessage): void {
    this.game.handleAction(data.options);
  }

  public get getPlayersAsArray(): Player[] {
    return Array.from(this.players.values());
  }
}

export default GameManager;
