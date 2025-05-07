import { WebSocket } from "ws";

type TournamentMemberStatus =
  | "joined"
  | "connected"
  | "waiting"
  | "playing"
  | "finished"
  | "disqualified";

export interface TournamentMember {
  id: string;
  isAI: boolean;
  status: TournamentMemberStatus;
  webSocket?: WebSocket;
}
