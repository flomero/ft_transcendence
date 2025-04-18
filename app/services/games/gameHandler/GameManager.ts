import { randomUUID } from "node:crypto";
import { type GameBase, GameStatus } from "../gameBase";
import type Player from "../../../interfaces/games/gameHandler/Player";
import type { WebSocket } from "ws";
import gameLoop from "./gameLoop";
import type GameMessage from "../../../interfaces/games/gameHandler/GameMessage";
import { PongAIOpponent } from "../pong/pongAIOpponent";
import aiLoop from "./aiLoop";
import { Database } from "sqlite";
import { RNG } from "../rng";
import saveGameResultInDb from "./saveGameResultInDb";

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

  public sendMessageToAll(
    type: string,
    data: string,
    referenceTable: string,
  ): void {
    for (const player of this.players.values()) {
      if (player.ws !== undefined) {
        player.ws.send(
          JSON.stringify({
            type: type,
            data: data,
            referenceTable: referenceTable,
          }),
        );
      }
    }
  }

  public getReferenceTable(): string {
    const playerIdReferenceTable: Array<{
      playerUUID: string;
      playerGameID: string;
    }> = [];

    for (let i = 0; i < this.playerIdReferenceTable.length; i++) {
      const playerUUID = this.playerIdReferenceTable[i];
      const playerIngameId = i;

      playerIdReferenceTable.push({
        playerUUID: playerUUID,
        playerGameID: playerIngameId.toString(),
      });
    }
    return JSON.stringify(playerIdReferenceTable);
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

    this.shuffleReferenceTable();
    this.addIngameIdToPlayerAndAiOpponent();
    this.game.startGame();
    this.startGameAndAiLoop(db);
  }

  private shuffleReferenceTable(): void {
    const tmpRng = new RNG();
    this.playerIdReferenceTable = tmpRng.randomArray(
      this.playerIdReferenceTable,
    );
  }

  private async startGameAndAiLoop(db: Database) {
    if (this.game.getStatus() === GameStatus.RUNNING) {
      gameLoop(this.id).then(async () => {
        await saveGameResultInDb(this, db);
      });
      aiLoop(this.id);
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
