import { randomUUID } from "node:crypto";
import { type GameBase, GameStatus } from "../gameBase";
import type Player from "../../../interfaces/games/gameHandler/Player";
import type { WebSocket } from "ws";
import gameLoop from "./gameLoop";
import type GameMessage from "../../../interfaces/games/gameHandler/GameMessage";
import type { Database } from "sqlite";

class GameManager {
  private id: string = randomUUID();
  game: GameBase;
  players: Map<string, Player> = new Map();

  constructor(game: GameBase) {
    this.game = game;
  }

  addPlayer(userId: string): void {
    const newPlayer = {
      id: this.players.size,
      playerUUID: userId,
    };
    this.players.set(userId, newPlayer);
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

  public startGame(db: Database): void {
    if (this.allPlayersAreConnected() === false) {
      throw new Error("Not all players are connected");
    }

    this.game.startGame();
    if (this.game.getStatus() === GameStatus.RUNNING) {
      gameLoop(this.id, db);
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
