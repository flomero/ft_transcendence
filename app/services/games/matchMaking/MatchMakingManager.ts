import MemberMatchMaking from "../../../interfaces/games/matchMaking/MemberMatchMaking";

class MatchMatkingManager {
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
      throw new Error(`Member with id ${memberId} not found`);
    }
    member.socket = undefined;
  }

  public memberExists(memberId: string): boolean {
    return this.members.has(memberId);
  }
}

export default MatchMatkingManager;
