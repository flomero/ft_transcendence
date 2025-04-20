import { GameSettings } from "../lobby/GameSettings";

type bracketTypeSettings =
  | "singleElimination"
  | "doubleElimination"
  | "roundRobin"
  | "swissRound";

export interface TournamentSettings {
  bracketType: bracketTypeSettings;
  matchWinner: string;
  players: string[];
  gameData: GameSettings;
}
