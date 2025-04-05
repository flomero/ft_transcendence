export type PlayerResults = {
  [matchID: string]: {
    won: boolean;
    results: number[];
  };
};

export type TournamentResults = {
  [playerID: string]: PlayerResults[];
};

export type CombinedResults = {
  [playerID: string]: {
    totalWins: number;
    totalScore: number;
  };
};
