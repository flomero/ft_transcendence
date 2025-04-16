import { FastifyInstance } from "fastify";

type LeaderboardEntry = { userId: string; username: string; score: number };
type MatchResult = "win" | "loss" | "draw";
type MatchInfo = {
  matchId: string;
  gameName: string;
  matchDate: string; // keep as string from DB; parse only for sorting
  leaderboard: LeaderboardEntry[];
  result: MatchResult;
};

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  const db = fastify.sqlite;

  const rows = await db.all<
    {
      matchId: string;
      gameName: string;
      matchDate: string;
      userId: string;
      username: string;
      score: number;
    }[]
  >(
    `
        SELECT r1.matchId,
               m.gameName,
               m.matchDate,
               r2.userId,
               u.username,
               r2.score
        FROM r_users_matches r1
                 JOIN r_users_matches r2 ON r1.matchId = r2.matchId
                 JOIN users u ON u.id = r2.userId
                 JOIN matches m ON m.id = r1.matchId
        WHERE r1.userId = ?
        ORDER BY m.matchDate DESC, r2.score DESC;
    `,
    userId,
  );

  // --- build map keyed by matchId ---
  const matchesMap = new Map<string, MatchInfo>();

  for (const row of rows) {
    const {
      matchId,
      gameName,
      matchDate,
      userId: playerId,
      username,
      score,
    } = row;

    if (!matchesMap.has(matchId)) {
      matchesMap.set(matchId, {
        matchId,
        gameName,
        matchDate,
        leaderboard: [],
        result: "loss",
      });
    }

    matchesMap
      .get(matchId)!
      .leaderboard.push({ userId: playerId, username, score });
  }

  // --- final per‑match processing ---
  for (const match of matchesMap.values()) {
    // rows are already score‑DESC, but sort once more for safety
    match.leaderboard.sort((a, b) => b.score - a.score);

    const topScore = match.leaderboard[0].score;
    const topScorers = match.leaderboard.filter((p) => p.score === topScore);

    if (topScorers.length > 1) {
      match.result = "draw";
    } else if (topScorers[0].userId === userId) {
      match.result = "win";
    }
  }

  const result = [...matchesMap.values()].sort(
    (a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate),
  );

  fastify.log.debug(
    `Match history for user ${userId}: ${JSON.stringify(result)}`,
  );

  return result;
};
