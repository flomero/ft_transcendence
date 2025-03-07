import type { LobbyMember } from "../../../types/games/lobby/LobbyMember";
import type { GameModes } from "../../../types/games/GameModes";
import { WebSocket } from "ws";
import { randomUUID } from "node:crypto";

class Lobby {
  private lobbyId: string = randomUUID();
  private lobbyMembers: Map<string, LobbyMember> = new Map();
  game: "pong"; //make private later
  gameMode: GameModes;//make private later
  lobbyOwner: string;//make private later

  constructor(game: "pong", gameMode: GameModes, memberId: string) {
    this.lobbyMembers.set(memberId, { id: memberId, isReady: false });
    this.game = game;
    this.gameMode = gameMode;
    this.lobbyOwner = memberId;
  }

  public addMember(memberId: string, socket: WebSocket): void {
    if (this.lobbyMembers.has(memberId)) {
      throw new Error("Member is already in the lobby");
    }
  }

  public get getLobbyId(): string {
    return this.lobbyId;
  }
};

export { Lobby };
