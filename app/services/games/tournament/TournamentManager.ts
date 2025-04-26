import { TournamentMember } from "../../../interfaces/games/tournament/TournamentMember";
import { randomUUID } from "node:crypto";
import { WebSocket } from "ws";
import { GameModeType } from "../../config/gameModes";
import { TournamentConfigKey } from "../../config/tournamentConfig";
import { Tournament, TournamentStatus } from "./tournament";
import createTournament from "./websocket/createTournament";
import { Database } from "sqlite";

class TournamentManager {
  public tournamentId: string = randomUUID();
  public ownerId: string | undefined; // Make private
  private tournamentMembers: Map<string, TournamentMember> = new Map();
  public tournamentConfigKey: TournamentConfigKey; // Make private
  public gameModeType: GameModeType;
  public tournament: Tournament | undefined;
  public tournamentSize: number;

  constructor(
    tournamentConfigKey: TournamentConfigKey,
    userId: string,
    gameModeType: GameModeType,
    tournamentSize: number,
  ) {
    this.ownerId = userId;
    this.gameModeType = gameModeType;
    this.tournamentConfigKey = tournamentConfigKey;
    this.tournamentSize = tournamentSize;

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
    if (
      memberId === this.ownerId &&
      this.tournament?.getStatus() === TournamentStatus.CREATED
    ) {
      this.changeOwner();
    }
  }

  public changeOwner() {
    if (this.tournamentMembers.size > 0) {
      const memberIds = Array.from(this.tournamentMembers.keys());
      this.ownerId = memberIds[0];
      return;
    }
    this.ownerId = undefined;
  }

  public async startTournament(db: Database): Promise<void> {
    if (this.canTournamentBeStarted() === false) {
      throw new Error("[start Tournemant] Tournament cannot be started");
    }

    this.tournament = await createTournament(db, this);
    this.tournament.startTournament();
  }

  public canTournamentBeStarted(): boolean {
    if (this.isTournamentFull() === false)
      throw new Error("Not enough members to start tournament");
    if (this.tournament?.getStatus() === TournamentStatus.ON_GOING)
      throw new Error("Tournament is already started");
    if (this.tournament?.getStatus() === TournamentStatus.FINISHED)
      throw new Error("Tournament is already finished");
    //if (this.allMembersAreConnected() === false)
    // throw new Error("Not all members are connected");
    return true;
  }

  public allMembersAreConnected(): boolean {
    for (const member of this.tournamentMembers.values()) {
      if (member.webSocket === undefined) {
        // check is ai later
        return false;
      }
    }
    return true;
  }

  public isTournamentFull(): boolean {
    return this.tournamentMembers.size === this.tournamentSize;
  }

  public getTournamentConfigKey(): TournamentConfigKey {
    return this.tournamentConfigKey;
  }

  public getPlayersUUIDs(): string[] {
    return Array.from(this.tournamentMembers.keys());
  }

  public getGameModeType(): GameModeType {
    return this.gameModeType;
  }

  public getTournamentStatus(): TournamentStatus | undefined {
    return this.tournament?.getStatus();
  }

  public getId(): string {
    return this.tournamentId;
  }
}

export default TournamentManager;
