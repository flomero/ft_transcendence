import { TournamentMember } from "../../../schemas/games/tournament/TournamentMember";
import { TournamentSettings } from "../../../interfaces/games/tournament/TournamentSettings";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";

class TournamentManager {
  public tournamentId: string = randomUUID();
  private tournamentMembers: Map<string, TournamentMember> = new Map();
  public tournamentSettings: TournamentSettings; // Make private
  public tournamentState: "created" | "running"; // Make private

  constructor(tournamentSettings: TournamentSettings, userId: string) {
    this.tournamentSettings = tournamentSettings;
    this.tournamentState = "created";

    const newMember: TournamentMember = {
      id: userId,
      status: "joined",
    };
    this.tournamentMembers.set(userId, newMember);
  }

  public setMemberSocket(memberId: string, socket: WebSocket): void {
    if (this.tournamentMembers.has(memberId) === false) {
      console.error(`Member: ${memberId} does not exist`);
      return;
    }
    this.tournamentMembers.get(memberId)!.webSocket = socket;
  }

  public addMember(memberId: string): void {
    if (this.tournamentMembers.has(memberId) === true) {
      console.warn(
        `Member: ${memberId} already exists in tournament: ${this.tournamentId}`,
      );
      return;
    }
    const newMember: TournamentMember = {
      id: memberId,
      status: "joined",
    };
    this.tournamentMembers.set(memberId, newMember);
  }

  public isMemberInTournament(memberId: string): boolean {
    return this.tournamentMembers.has(memberId);
  }

  public removeMemberSave(memberId: string): void {
    if (this.tournamentMembers.has(memberId) === false) {
      console.warn(
        `Member: ${memberId} does not exist in tournament: ${this.tournamentId}`,
      );
      return;
    }
    const member = this.tournamentMembers.get(memberId);
    member?.webSocket?.close();
    this.tournamentMembers.delete(memberId);
  }
}

export default TournamentManager;
