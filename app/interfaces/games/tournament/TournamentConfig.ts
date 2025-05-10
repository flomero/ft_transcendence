import type { BracketTypeSettings } from "./TournamentSettings";

export interface TournamentConfig {
  bracketType: BracketTypeSettings;
  matchWinner: string;
}
