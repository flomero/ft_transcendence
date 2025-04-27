import type { Lobby } from "../../../services/games/lobby/Lobby";
//import { TournamentManager } from "../../../services/tournament/tournament";

export type GameOrigin = {} & (
  | {
      type: "lobby";
      lobby: Lobby;
    }
  | {
      type: "matchMaking";
    }
  | {
      type: "tournament";
      // tournament: TournamentManager;
    }
);
