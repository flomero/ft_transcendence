import { Modifiers } from "../../types/game/MatchOptions";

export interface gameMessageInterface {
  messageType: string;
  match: "pong";
  matchMode?: string;
  modifiers?: Modifiers[];
  matchId?: string;
  imput?: string;
  timeStamp?: string;
}
