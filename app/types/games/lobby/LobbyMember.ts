import type { WebSocket } from "ws";

export type LobbyMember = {
  id: string;
  userState: "notInLobby" | "inLobby" | "inMatch";
  isReady: boolean;
  socket?: WebSocket;
  isAi: boolean;
};
