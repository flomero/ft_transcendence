import { TournamentMember } from "../../../interfaces/games/tournament/TournamentMember";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import { GameModeType } from "../../config/gameModes";
import { TournamentConfigKey } from "../../config/tournamentConfig";

class TournamentManager {
  public tournamentId: string = randomUUID();
  public ownerId: string; // Make private
  private tournamentMembers: Map<string, TournamentMember> = new Map();
  public tournamentConfigKey: TournamentConfigKey; // Make private
  public tournamentState: "created" | "running"; // Make private
  public gameMode: GameModeType;

  constructor(
    tournamentConfigKey: TournamentConfigKey,
    userId: string,
    gameMode: GameModeType,
    tournamenttSize: number,
  ) {
    this.tournamentState = "created";
    this.ownerId = userId;
    this.gameMode = gameMode;
    this.tournamentConfigKey = tournamentConfigKey;

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
    //    if (memberId === this.ownerId)
  }

  //  private changeOwner() {}
}

export default TournamentManager;
