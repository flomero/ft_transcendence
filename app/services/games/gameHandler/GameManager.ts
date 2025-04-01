import { randomUUID } from "node:crypto";
import { GameBase } from "../gameBase";

class GameManager {
  private id: string = randomUUID();
  game: GameBase;
  players: Map<string, number> = new Map();

  constructor(game: GameBase) {
    this.game = game;
  }

  addPlayer(userId: string): void {
    this.players.set(userId, this.players.size);
  }

  public get getId() {
    return this.id;
  }
}

export default GameManager;
