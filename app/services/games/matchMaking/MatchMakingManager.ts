import type MemberMatchMaking from "../../../interfaces/games/matchMaking/MemberMatchMaking";
import type WebSocket from "ws";
import { GameModeType } from "../../config/gameModes";

class MatchMakingManager {
  private members: Map<string, MemberMatchMaking> = new Map<
    string,
    MemberMatchMaking
  >();

  public addMember(memberId: string, gameMode: GameModeType) {
    let member = this.members.get(memberId);
    if (member) {
      member.gameMode = gameMode;
      this.sendWaitingMessage(gameMode);
      return;
    }
    member = {
      memberId: memberId,
      gameMode: gameMode,
    };
    this.members.set(member.memberId, member);

    this.sendWaitingMessage(gameMode);
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
    const gameMode = this.members.get(memberId)?.gameMode;
    this.members.delete(memberId);

    if (gameMode !== undefined) {
      this.sendWaitingMessage(gameMode);
    }
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

  private sendWaitingMessage(gameMode: GameModeType) {
    const membersGameMode = this.members
      .entries()
      .filter((entry) => entry[1].gameMode === gameMode)
      .toArray();
    const cueSize = membersGameMode.length;
    membersGameMode.forEach((entry) => {
      this.sendMessageToMember(
        entry[0],
        JSON.stringify({
          type: "updateText",
          data: "Players waiting: " + cueSize,
        }),
      );
    });
  }
}

export default MatchMakingManager;

export const matchMakingManager = new MatchMakingManager();

/**
 * Check if a user is in match making
 * @param userId
 * @returns {GameModeType | null} The game mode if the user is in match making, null otherwise
 */
export const isUserInMatchMaking = (userId: string): GameModeType | null => {
  const member = matchMakingManager
    .getAllMembers()
    .find((member) => member.memberId === userId);
  if (member) {
    return member.gameMode;
  }
  return null;
};
