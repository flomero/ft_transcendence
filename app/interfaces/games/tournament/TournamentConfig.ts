import type { bracketTypeSettings } from "./TournamentSettings";

export interface TournamentConfig {
  bracketType: bracketTypeSettings;
  matchWinner: string;
}
