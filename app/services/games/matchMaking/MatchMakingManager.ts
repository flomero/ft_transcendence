import { MatchmakingGameModes } from "../../../config";
import type MemberMatchMaking from "../../../interfaces/games/matchMaking/MemberMatchMaking";
import type WebSocket from "ws";

class MatchMakingManager {
  private members: Map<string, MemberMatchMaking> = new Map<
    string,
    MemberMatchMaking
  >();

  public getGameMode(gameModeString: string): MatchmakingGameModes | null {
    const gameMode = Object.values(MatchmakingGameModes).find(
      (mode) => mode.toLowerCase() === gameModeString.toLowerCase(),
    );
    if (gameMode === undefined) return null;
    return gameMode as MatchmakingGameModes;
  }

  public addMember(memberId: string, gameMode: MatchmakingGameModes) {
    let member = this.members.get(memberId);
    if (member) {
      member.gameMode = gameMode;
      return;
    }
    member = {
      memberId: memberId,
      gameMode: gameMode,
    };
    this.members.set(member.memberId, member);
  }

  public removeMemberSocket(memberId: string) {
    const member = this.members.get(memberId);
    if (member === undefined) return;
    member.socket?.close();
    member.socket = undefined;
  }

  public memberExists(memberId: string): boolean {
    return this.members.has(memberId);
  }

  public sendMessageToMember(memberId: string, message: string): void {
    const member = this.members.get(memberId);
    if (!member) return;
    if (!member.socket) return;
    member.socket.send(message);
  }

  public removeMember(memberId: string) {
    this.removeMemberSocket(memberId);
    if (this.members.has(memberId) === false) {
      throw new Error(`[ removeMember ] Member with id ${memberId} not found`);
    }
    this.members.delete(memberId);
  }

  public get memberSize(): number {
    return this.members.size;
  }

  public setMemberSocket(memberId: string, socket: WebSocket) {
    const member = this.members.get(memberId);
    if (member === undefined) {
      throw new Error(
        `[set member socket] Member with id ${memberId} not found`,
      );
    }
    member.socket = socket;
  }

  public getAllMembers(): MemberMatchMaking[] {
    return Array.from(this.members.values());
  }
}

export default MatchMakingManager;
