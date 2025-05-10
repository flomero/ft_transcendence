export type LeaderboardEntry = {
  userId: string;
  username: string;
  score: number;
  result: number;
  showScore: boolean;
};
export type MatchResult = "win" | "loss" | "draw";
export type MatchInfo = {
  matchId: string;
  gameModeName: string;
  matchDate: number; // keep as string from DB; parse only for sorting
  leaderboard: LeaderboardEntry[];
  result: MatchResult;
  isFinished: boolean;
};
