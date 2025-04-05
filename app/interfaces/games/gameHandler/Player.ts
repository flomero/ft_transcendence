import { WebSocket } from "ws";

interface Player {
  id: number;
  ws?: WebSocket;
}

export default Player;
