import type { LobbyMember } from "../../../types/games/lobby/LobbyMember";
import type { GameModes } from "../../../types/games/GameModes";
import { WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import MinAndMaxPlayers from "../../../types/games/lobby/MinAndMaxPlayers";

class Lobby {
  private lobbyId: string = randomUUID();
  private lobbyMembers: Map<string, LobbyMember> = new Map();
  stateLobby: "open" | "closed" | "started"; // make private later
  game: "pong"; //make private later
  gameMode: GameModes; //make private later
  lobbyOwner: string; //make private later
  memberLimits: { min: number; max: number }; //make private later

  constructor(game: "pong", gameMode: GameModes, memberId: string) {
    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: false,
    };

    this.lobbyMembers.set(memberId, newMember);
    this.game = game;
    this.gameMode = gameMode;
    this.lobbyOwner = memberId;
    this.stateLobby = "open";
    this.memberLimits = this.getMemberLimits(gameMode);
    console.log("Member limits: ", this.memberLimits);
    this.printLobbyMembers();
  }

  private getMemberLimits(gameMode: GameModes): { min: number; max: number } {
    if (MinAndMaxPlayers[gameMode] !== undefined)
      return MinAndMaxPlayers[gameMode];
    throw new Error("Game mode not found: " + gameMode);
  }

  public addMember(memberId: string): void {
    if (this.lobbyMembers.has(memberId)) {
      throw new Error("Member is already in the lobby");
    } else if (this.stateLobby === "closed") {
      throw new Error("Lobby is closed already");
    }
    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: false,
    };
    this.lobbyMembers.set(memberId, newMember);
    this.closeLobbyIfMaxMembers();
  }

  public get getLobbyId(): string {
    return this.lobbyId;
  }

  public isUserInLobby(memberId: string): boolean {
    return this.lobbyMembers.has(memberId);
  }

  public removeMember(memberId: string): void {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[removeMember] Member is not in the lobby");
    }
    this.lobbyMembers.delete(memberId);
  }

  public memberStatus(memberId: string): "notInLobby" | "inLobby" | "inMatch" {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("Member is not in the lobby");
    }
    return this.lobbyMembers.get(memberId)!.userState;
  }

  public disconnectMember(memberId: string): void {
    if (
      this.lobbyMembers.get(memberId)?.userState === "inMatch" ||
      this.lobbyMembers.get(memberId)?.socket === undefined
    ) {
      throw new Error(
        "[disconnectMember] Member is not in the lobby WebSocket",
      );
    }
    this.lobbyMembers.get(memberId)!.userState = "notInLobby";
    this.lobbyMembers.get(memberId)!.socket!.close();
    this.lobbyMembers.get(memberId)!.socket = undefined;
  }

  public addSocketToMember(memberId: string, socket: WebSocket): void {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("Member is not in the lobby");
    } else if (this.lobbyMembers.get(memberId)!.socket !== undefined) {
      throw new Error("Member already has a socket");
    }
    this.lobbyMembers.get(memberId)!.socket = socket;
    this.lobbyMembers.get(memberId)!.userState = "inLobby";
  }

  public changeState(ownerId: string, newState: "open" | "started"): void {
    if (this.lobbyOwner !== ownerId) {
      throw new Error("Only the owner can change the state");
    }
    this.stateLobby = newState;
  }

  public get lobbyState(): "open" | "closed" | "started" {
    return this.stateLobby;
  }

  private closeLobbyIfMaxMembers(): void {
    if (this.lobbyMembers.size === this.memberLimits.max) {
      this.stateLobby = "closed";
    }
  }
  private printLobbyMembers(): void {
    console.log("Lobby members: ");
    this.lobbyMembers.forEach((member) => {
      console.log(member.id);
    });
  }
}

export { Lobby };
