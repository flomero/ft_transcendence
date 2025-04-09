import type MemberMatchMaking from "../../../interfaces/games/matchMaking/MemberMatchMaking";
import type WebSocket from "ws";

class MatchMakingManager {
  private members: Map<string, MemberMatchMaking> = new Map<
    string,
    MemberMatchMaking
  >();

  public addMember(memberId: string) {
    const member: MemberMatchMaking = {
      memberId: memberId,
    };
    this.members.set(member.memberId, member);
  }

  public removeMemberSocket(memberId: string) {
    const member = this.members.get(memberId);
    if (member === undefined) {
      throw new Error(
        `[ removeMemberSocket ] Member with id ${memberId} not found`,
      );
    }
    member.socket?.close();
    member.socket = undefined;
  }

  public memberExists(memberId: string): boolean {
    return this.members.has(memberId);
  }

  public getLastTwoMember(): MemberMatchMaking[] {
    if (this.members.size <= 1)
      throw new Error(
        "[ getLastTwoMember ] Less than two members in the match making",
      );
    const members = Array.from(this.members.values());
    return members.slice(-2);
  }

  public sendMessageToMember(memberId: string, message: string): void {
    const member = this.members.get(memberId);
    if (member === undefined) {
      throw new Error(
        `[ sendMessageToMember ] Member with id ${memberId} not found`,
      );
    }
    if (member.socket === undefined) {
      throw new Error(
        `[ sendMessageToMember ] Member with id ${memberId} has no socket`,
      );
    }
    member.socket.send(message);
  }

  public closeSocketConnectionOfLastTwoMembers(): void {
    if (this.members.size <= 1)
      throw new Error(
        "[ closeSocketConnectionOfLastTwoMembers ] Less than two members in the match making",
      );
    const members = Array.from(this.members.values()).slice(-2);
    if (members[0].socket !== undefined) members[0].socket.close();
    if (members[1].socket !== undefined) members[1].socket.close();
  }

  public removeLastTwoMembers(): void {
    if (this.members.size <= 1)
      throw new Error(
        "[ removeLastTwoMembers ] Less than two members in the match making",
      );
    const members = Array.from(this.members.values()).slice(-2);
    this.members.delete(members[0].memberId);
    this.members.delete(members[1].memberId);
  }

  public removeMember(memberId: string) {
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
}

export default MatchMakingManager;
