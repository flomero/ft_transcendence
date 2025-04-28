import { Lobby } from "../../../services/games/lobby/Lobby";
import type TournamentManager from "../../../services/games/tournament/TournamentManager";

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
      tournament: TournamentManager;
    }
);
