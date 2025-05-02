import type { WebSocket } from "ws";
import { GameModeType } from "../../../services/config/gameModes";

interface MemberMatchMaking {
  memberId: string;
  socket?: WebSocket;
  gameMode: GameModeType;
}

export default MemberMatchMaking;
