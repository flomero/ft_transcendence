import { WebSocket } from "ws";

export type LobbyMember = {
  id: string;
  isReady: boolean;
  socket?: WebSocket;
};
