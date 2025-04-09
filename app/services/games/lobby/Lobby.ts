import type { LobbyMember } from "../../../types/games/lobby/LobbyMember";
import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import type { WebSocket } from "ws";
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

  public addMember(memberId: string): void {
    this.canMemberBeAddedCheck(memberId);

    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: false,
    };

    this.lobbyMembers.set(memberId, newMember);
    this.sendMessageToAllMembers(
      JSON.stringify({ type: "memberJoined", data: memberId }),
    );
  }

  public isUserInLobby(memberId: string): boolean {
    return this.lobbyMembers.has(memberId);
  }

  public removeMember(memberId: string): void {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[removeMember] Member is not in the lobby");
    }
    this.lobbyMembers.delete(memberId);
    this.sendMessageToAllMembers(
      JSON.stringify({ type: "memberLeft", data: memberId }),
    );
  }

  public memberStatus(memberId: string): "notInLobby" | "inLobby" | "inMatch" {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[memberStatus] Member is not in the lobby");
    }
    return this.lobbyMembers.get(memberId)!.userState;
  }

  public getMember(memberId: string): LobbyMember | undefined {
    return this.lobbyMembers.get(memberId);
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
      throw new Error("[addSocketToMember] Member is not in the lobby");
    } else if (this.lobbyMembers.get(memberId)!.socket !== undefined) {
      throw new Error("[addSocketToMember] Member already has a socket");
    }
    this.lobbyMembers.get(memberId)!.socket = socket;
    this.lobbyMembers.get(memberId)!.userState = "inLobby";
  }

  public changeState(ownerId: string, newState: "open" | "started"): void {
    if (this.lobbyOwner !== ownerId) {
      throw new Error("Only the owner can change the state");
    }
    if (newState === "started") {
      this.gameSettings.playerCount = this.lobbyMembers.size;
    }
    this.stateLobby = newState;
  }

  public changeLockState(memberId: string, state: boolean): void {
    if (this.lobbyOwner !== memberId) {
      throw new Error("Only the owner can lock the lobby");
    }
    this.locketLobby = state;
  }

  public reachedMinPlayers(): boolean {
    if (this.lobbyMembers.size >= this.memberLimits.min === true) return true;
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

  public sendMessageToAllMembers(message: string): void {
    this.lobbyMembers.forEach((member) => {
      member.socket?.send(message);
    });
  }

  public setMemberReadyState(memberId: string, isReady: boolean): void {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[setMemberReadyState] Member is not in the lobby");
    } else if (this.isMemberConnectedToSocket(memberId) === false) {
      throw new Error(
        "[setMemberReadyState] Member is not connected to the socket",
      );
    }
    this.lobbyMembers.get(memberId)!.isReady = isReady;
    this.sendMessageToAllMembers(
      JSON.stringify({ type: "memberReady", data: { memberId } }),
    );
    if (this.allMembersReady()) {
      this.sendMessageToMember(
        this.lobbyOwner,
        JSON.stringify({ type: "allReady", data: "" }),
      );
    }
  }

  public isMemberOwner(memberId: string): boolean {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[isMemberOwner] Member is not in the lobby");
    }
    return this.lobbyOwner === memberId;
  }

  public disconnectAllMembers(): void {
    for (const member of this.lobbyMembers.values()) {
      this.sendMessageToMember(member.id, "Lobby is closed");
      if (member.socket !== undefined) {
        member.socket.close();
      }
    }
  }

  public isUserLastMember(memberId: string): boolean {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[isMemberOwner] Member is not in the lobby");
    } else if (this.lobbyMembers.size === 1) {
      return true;
    }
    return false;
  }

  public getMemberState(
    memberId: string,
  ): "notInLobby" | "inLobby" | "inMatch" {
    if (this.lobbyMembers.has(memberId) === false) {
      throw new Error("[isMemberOwner] Member is not in the lobby");
    }
    return this.lobbyMembers.get(memberId)!.userState;
  }

  public allMembersConnectedToSocket(): boolean {
    for (const member of this.lobbyMembers.values()) {
      if (member.socket === undefined) {
        return false;
      }
    }
    return true;
  }

  public get lobbyState(): "open" | "started" {
    return this.stateLobby;
  }

  public get getLobbyId(): string {
    return this.lobbyId;
  }

  public get getGameSettings(): GameSettings {
    return this.gameSettings;
  }

  public get isLobbyLocked(): boolean {
    return this.locketLobby;
  }

  public getMemberAsArray(): LobbyMember[] {
    return Array.from(this.lobbyMembers.values());
  }

  public printGameSettings(): void {
    console.log("GameSettings: ");
    console.log(this.gameSettings);
  }

  private getMemberLimits(): { min: number; max: number } {
    if (MinAndMaxPlayers[this.gameSettings.gameModeName] !== undefined)
      return MinAndMaxPlayers[this.gameSettings.gameModeName];
    throw new Error("Game mode not found: " + this.gameSettings.gameModeName);
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

  private canMemberBeAddedCheck(memberId: string): void {
    if (this.lobbyMembers.has(memberId)) {
      throw new Error("Member is already in the lobby");
    } else if (this.locketLobby === true) {
      throw new Error("Lobby is locked already");
    } else if (this.isLobbyFull()) {
      throw new Error("Lobby is full");
    }
  }

  private sendMessageToMember(memberId: string, message: string): void {
    if (this.lobbyMembers.get(memberId)?.socket === undefined) {
      console.error(
        `[sendMessageToMember] Member ${memberId} is not connected to the socket`,
      );
      return;
    }
    this.lobbyMembers.get(memberId)?.socket?.send(message);
  }
}

export { Lobby };
