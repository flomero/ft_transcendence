import type { LobbyMember } from "../../../types/games/lobby/LobbyMember";
import type { GameSettings } from "../../../interfaces/games/lobby/GameSettings";
import type { WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import MinAndMaxPlayers from "../../../types/games/lobby/MinAndMaxPlayers";
import aiOpponents from "../aiOpponent/aiOpponents";
import { fastifyInstance } from "../../../app";
import { GAME_MODES } from "../../../schemas/games/lobby/newLobbySchema";

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
      isAi: false,
      isLocal: false,
    };

    this.lobbyMembers.set(memberId, newMember);
    this.lobbyOwner = memberId;
    this.stateLobby = "open";
    this.gameSettings = gameSettings;
    this.memberLimits = this.getMemberLimits();
    this.printLobbyMembers();

    this.printLobbyMembers();
  }

  public addMember(memberId: string): void {
    this.canMemberBeAddedCheck(memberId);

    const newMember: LobbyMember = {
      id: memberId,
      userState: "notInLobby",
      isReady: false,
      isAi: false,
      isLocal: false,
    };

    this.lobbyMembers.set(memberId, newMember);
    this.sendMessageToAllMembers(
      JSON.stringify({ type: "memberJoined", data: memberId }),
    );
  }

  public addAiOpponent(memberId: string): void {
    this.canAIBeAddedCheck(memberId);

    const aiId = this.getNumberOfAiOpponents();
    const newAiOpponent: LobbyMember = {
      id: aiId.toString(),
      userState: "notInLobby",
      isReady: true,
      isAi: true,
      isLocal: false,
    };

    this.sendMessageToAllMembers(
      JSON.stringify({ type: "addedAI", data: aiId.toString() }),
    );
    this.lobbyMembers.set(
      this.getNumberOfAiOpponents().toString(),
      newAiOpponent,
    );
  }

  private canAIBeAddedCheck(memberId: string): void {
    if (this.isMemberOwner(memberId) === false) {
      throw new Error(
        "[addAiOpponent] Member who wants to add AI got to be the Owner of the lobby",
      );
    } else if (this.isLobbyLocked === true) {
      throw new Error("[addAiOpponent] AI cannot be added to a locked lobby");
    } else if (this.isLobbyFull() === true) {
      throw new Error("[addAiOpponent] AI cannot be added to a full lobby");
    } else if (this.getNumberOfAiOpponents() >= aiOpponents.length)
      throw new Error(
        `[addAiOpponent] Only ${aiOpponents.length} AI opponents can be added`,
      );
  }

  // memberId of the player that adds the local player
  public addLocalPlayer(memberId: string) {
    // Check if there isn't another one with #memberId already
    const localPlayerID = "#" + memberId;
    this.canLocalPlayerBeAddedCheck(localPlayerID, memberId);

    const newMember: LobbyMember = {
      id: localPlayerID,
      userState: "notInLobby",
      isReady: true,
      isAi: false,
      isLocal: true,
    };

    this.sendMessageToAllMembers(
      JSON.stringify({ type: "addedAI", data: localPlayerID }),
    );
    this.lobbyMembers.set(localPlayerID, newMember);
  }

  private canLocalPlayerBeAddedCheck(
    localPlayerId: string,
    memberId: string,
  ): void {
    if (this.isMemberOwner(memberId) === false) {
      throw new Error(
        "[addLocalPlayer] Member who wants to add Local Player got to be the Owner of the lobby",
      );
    } else if (Object.values(this.lobbyMembers).length >= this.memberLimits.max)
      throw new Error(
        "[addLocalPlayer] Local player cannot be added to a full lobby",
      );
    else if (this.gameSettings.gameModeName !== GAME_MODES.CLASSIC)
      throw new Error(
        "[addLocalPlayer] Local player cannot be added to a non-classic game mode",
      );
    for (const lobbyMember of Object.keys(this.lobbyMembers)) {
      if (lobbyMember === localPlayerId)
        throw new Error(
          "[addLocalPlayer] can't add more than 1 local player per player",
        );
    }
  }

  private getNumberOfAiOpponents(): number {
    let numAiOpponents = 0;
    for (const member of this.lobbyMembers.values()) {
      if (member.isAi === true) {
        numAiOpponents++;
      }
    }
    return numAiOpponents;
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
    const member = this.lobbyMembers.get(memberId);
    if (member === undefined) {
      throw new Error("[disconnectMember] Member is not in the lobby");
    }

    member.userState = "notInLobby";
    if (member.socket !== undefined) {
      member.socket.close();
      member.socket = undefined;
    }
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

  public set setStateLobby(newState: "open" | "started") {
    this.stateLobby = newState;
  }

  public changeLockState(memberId: string, state: boolean): void {
    if (this.lobbyOwner !== memberId) {
      throw new Error("Only the owner can lock the lobby");
    }
    this.locketLobby = state;
  }

  public reachedMinPlayers(): boolean {
    const memberPlusAiSize = this.lobbyMembers.size;
    if (memberPlusAiSize >= this.memberLimits.min) return true;
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
    this.sendMessageToAllMembers(
      JSON.stringify({ type: "disconnect", data: "owner left the lobby" }),
    );
    for (const member of this.lobbyMembers.values()) {
      if (member.socket !== undefined) {
        member.socket.close();
        member.socket = undefined;
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
      if (
        member.socket === undefined &&
        member.isAi === false &&
        member.isLocal === false
      ) {
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
    fastifyInstance.log.debug("GameSettings: ");
    fastifyInstance.log.debug(this.gameSettings);
  }

  private getMemberLimits(): { min: number; max: number } {
    if (this.gameSettings.playerCount)
      return {
        min: this.gameSettings.playerCount,
        max: this.gameSettings.playerCount,
      };
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

  public isLobbyFull(): boolean {
    const memberPlusAiSize = this.lobbyMembers.size;
    if (memberPlusAiSize >= this.memberLimits.max) {
      return true;
    }
    return false;
  }

  private printLobbyMembers(): void {
    fastifyInstance.log.debug("Lobby members: ");
    this.lobbyMembers.forEach((member) => {
      fastifyInstance.log.debug(member.id);
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
