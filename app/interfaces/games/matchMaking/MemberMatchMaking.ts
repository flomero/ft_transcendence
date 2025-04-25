import type { WebSocket } from "ws";
import type { MatchmakingGameModes } from "../../../config";

interface MemberMatchMaking {
  memberId: string;
  socket?: WebSocket;
  gameMode: MatchmakingGameModes;
}

export default MemberMatchMaking;
