import type { WebSocket } from "ws";

interface Player {
  id: number;
  playerUUID: string;
  ws?: WebSocket;
  timeOut?: NodeJS.Timeout;
  leftGame: boolean;
}

export default Player;
