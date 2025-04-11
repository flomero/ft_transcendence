import type { WebSocket } from "ws";

interface Player {
  id: number;
  playerUUID: string;
  ws?: WebSocket;
}

export default Player;
