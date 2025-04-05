import { WebSocket } from "ws";

interface MemberMatchMaking {
  memberId: string;
  socket?: WebSocket;
}

export default MemberMatchMaking;
