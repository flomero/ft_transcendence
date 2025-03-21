import type { LobbyMember } from "../../../types/games/lobby/LobbyMember";
import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import { WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import MinAndMaxPlayers from "../../../types/games/lobby/MinAndMaxPlayers";

class Lobby {
  private lobbyId: string = randomUUID();
  private lobbyMembers: Map<string, LobbyMember> = new Map();
  private stateLobby: "open" | "started";
  private locketLobby: boolean = false;
  gameSettings: GameSettings; //make private later
  lobbyOwner: string; //make private later
  memberLimits: { min: number; max: number }; //make private later

  constructor(gameSettings: GameSettings, memberId: string) {
    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: true,
    };

    this.lobbyMembers.set(memberId, newMember);
    this.lobbyOwner = memberId;
    this.stateLobby = "open";
    this.gameSettings = gameSettings;
    this.memberLimits = this.getMemberLimits();
    this.printLobbyMembers();
  }

  private getMemberLimits(): { min: number; max: number } {
    if (MinAndMaxPlayers[this.gameSettings.gameMode] !== undefined)
      return MinAndMaxPlayers[this.gameSettings.gameMode];
    throw new Error("Game mode not found: " + this.gameSettings.gameMode);
  }

  public addMember(memberId: string): void {
    this.canMemberBeAddedCheck(memberId);

    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: false,
    };

    this.lobbyMembers.set(memberId, newMember);
  }

  public get getLobbyId(): string {
    return this.lobbyId;
  }

  public get getGameSettings(): GameSettings {
    return this.gameSettings;
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

  public get lobbyState(): "open" | "started" {
    return this.stateLobby;
  }

  public changeLockState(memberId: string, state: boolean): void {
    if (this.lobbyOwner !== memberId) {
      throw new Error("Only the owner can lock the lobby");
    }
    this.locketLobby = state;
  }

  public reachedMinPlayers(): boolean {
    if (this.lobbyMembers.size >= this.memberLimits.min) {
      return true;
    }
    return false;
  }

  public allMembersReady(): boolean {
    for (const member of this.lobbyMembers.values()) {
      if (member.isReady === false) {
        return false;
      }
    }
    return true;
  }

  public getMemberState(
    memberId: string,
  ): "notInLobby" | "inLobby" | "inMatch" {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("Member is not in the lobby");
    }
    return this.lobbyMembers.get(memberId)!.userState;
  }

  public setMemberReadyState(memberId: string, isReady: boolean): void {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("Member is not in the lobby");
    } else if (this.isMemberConnectedToSocket(memberId) === false) {
      throw new Error("Member is not connected to the socket");
    }
    this.lobbyMembers.get(memberId)!.isReady = isReady;
    if (this.allMembersReady()) {
      this.sendMessateToMember(this.lobbyOwner, "Lobby is ready to start");
    }
  }

  public get isLobbyLocked(): boolean {
    return this.locketLobby;
  }

  private isMemberConnectedToSocket(memberId: string): boolean {
    if (this.lobbyMembers.get(memberId)?.userState !== "inLobby") {
      return false;
    }
    return true;
  }

  private isLobbyFull(): boolean {
    if (this.lobbyMembers.size >= this.memberLimits.max) {
      return true;
    }
    return false;
  }

  private printLobbyMembers(): void {
    console.log("Lobby members: ");
    this.lobbyMembers.forEach((member) => {
      console.log(member.id);
    });
  }

  public printGameSettings(): void {
    console.log("GameSettings: ");
    console.log(this.gameSettings);
  }

  public getMemberAsArray(): LobbyMember[] {
    return Array.from(this.lobbyMembers.values());
  }

  private canMemberBeAddedCheck(memberId: string): void {
    if (this.lobbyMembers.has(memberId)) {
      throw new Error("Member is already in the lobby");
    } else if (this.locketLobby === true) {
      throw new Error("Lobby is locked already");
    } else if (this.isLobbyFull()) {
      throw new Error("Lobby is full");
    }
  }

  private sendMessateToMember(memberId: string, message: string): void {
    if (this.lobbyMembers.get(memberId)?.socket === undefined) {
      throw new Error("Member is not connected to the socket");
    }
    this.lobbyMembers.get(memberId)?.socket?.send(message);
  }
}

export { Lobby };
