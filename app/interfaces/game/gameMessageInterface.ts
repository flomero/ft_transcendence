import { Modifiers } from "../../services/game/websocket/Match";

export interface gameMessageInterface {
  messageType: string;
  match: "pong";
  matchMode?: string;
  modifiers?: Modifiers[];
  matchId?: string;
  imput?: string;
  timeStamp?: string;
}
