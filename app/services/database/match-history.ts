import type { FastifyInstance } from "fastify";

import type { MatchInfo } from "../../types/games/match-history";

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  const db = fastify.sqlite;

  const rows = await db.all<
    {
      matchId: string;
      gameModeName: string;
      matchDate: string;
      playerCount: number;
      isFinished: boolean;
      userId: string;
      username: string;
      score: number;
      result: number;
    }[]
  >(
    `
      SELECT r1.matchId,
             m.gameModeName,
             m.matchDate || ' UTC' as matchDate,
             m.playerCount,
             m.result as isFinished,
             r2.userId,
             u.username,
             r2.score,
             r2.result
      FROM r_users_matches r1
             JOIN r_users_matches r2 ON r1.matchId = r2.matchId
             JOIN users u ON u.id = r2.userId
             JOIN matches m ON m.id = r1.matchId
      WHERE r1.userId = ?
      ORDER BY m.matchDate DESC, r2.result;
    `,
    userId,
  );

  // --- build map keyed by matchId ---
  const matchesMap = new Map<string, MatchInfo>();

  for (const row of rows) {
    const {
      matchId,
      gameModeName,
      matchDate,
      playerCount,
      userId: playerId,
      isFinished,
      username,
      score,
      result,
    } = row;

    if (!matchesMap.has(matchId)) {
      matchesMap.set(matchId, {
        matchId,
        gameModeName: gameModeName,
        matchDate,
        leaderboard: [],
        result: "loss",
        isFinished,
      });
    }

    let showScore = playerCount === 2;

    matchesMap.get(matchId)!.leaderboard.push({
      userId: playerId,
      username,
      score,
      result,
      showScore,
    });
  }

  // --- final per‑match processing ---
  for (const match of matchesMap.values()) {
    // rows are already score‑DESC, but sort once more for safety
    match.leaderboard.sort((a, b) => a.result - b.result);

    const topScore = match.leaderboard[0].score;
    const topScorers = match.leaderboard.filter((p) => p.score === topScore);
    const isUserTopScorer = topScorers.some((p) => p.userId === userId);

    if (topScorers.length > 1 && isUserTopScorer) {
      match.result = "draw";
    } else if (topScorers[0].userId === userId) {
      match.result = "win";
    }
    // else default stays "loss"
  }

  const result = [...matchesMap.values()].sort(
    (a, b) => Date.parse(b.matchDate) - Date.parse(a.matchDate),
  );

  fastify.log.debug(
    `Match history for user ${userId}: ${JSON.stringify(result)}`,
  );

  return result;
};
