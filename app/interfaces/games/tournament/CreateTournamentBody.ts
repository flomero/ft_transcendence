export interface CreateTournamentBody {
  name: string;
  bracketType:
    | "singleElimination"
    | "doubleElimination"
    | "roundRobin"
    | "swissRound";
  matchWinnerType: string;
  initialSeedingMethod: string;
  gameData: {
    gameName: string;
    gameModeName: string;
    playerCount: number;
    modifierNames: Record<string, any>;
    powerUpNames: Record<string, any>;
    gameModeConfig: Record<string, any>;
  };
}
