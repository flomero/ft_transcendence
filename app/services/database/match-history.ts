import type { FastifyInstance } from "fastify";

import type { MatchInfo } from "../../types/games/match-history";

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  const db = fastify.sqlite;

  /* ➊ ─────────────── tell TypeScript matchDate is a number ─────────────── */
  const rows = await db.all<
    {
      matchId: string;
      gameModeName: string;
      matchDate: number; // <-- was string
      playerCount: number;
      isFinished: boolean;
      userId: string;
      username: string;
      score: number;
      result: number;
    }[]
  >(
    /* unchanged SQL — matchDate comes back as the INTEGER we stored */
    `
      SELECT r1.matchId,
             m.gameModeName,
             m.matchDate,          -- seconds since epoch (UTC)
             m.playerCount,
             m.result as isFinished,
             r2.userId,
             u.username,
             r2.score,
             r2.result
      FROM r_users_matches r1
             JOIN r_users_matches r2 ON r1.matchId = r2.matchId
             JOIN users u          ON u.id = r2.userId
             JOIN matches m        ON m.id = r1.matchId
      WHERE r1.userId = ?
      ORDER BY m.matchDate DESC, r2.result;
    `,
    userId,
  );

  /* ➋ ───────────────────── build map keyed by matchId ──────────────────── */
  const matchesMap = new Map<string, MatchInfo>();

  for (const row of rows) {
    const {
      matchId,
      gameModeName,
      matchDate: matchDateSec, // ← epoch-seconds from DB
      playerCount,
      userId: playerId,
      isFinished,
      username,
      score,
      result,
    } = row;

    /* convert *once* here */
    const matchDateMs = matchDateSec * 1000; // epoch-milliseconds

    if (!matchesMap.has(matchId)) {
      matchesMap.set(matchId, {
        matchId,
        gameModeName,
        matchDate: matchDateMs, // store ms so the client can use it directly
        leaderboard: [],
        result: "loss",
        isFinished,
      });
    }

    matchesMap.get(matchId)!.leaderboard.push({
      userId: playerId,
      username,
      score,
      result,
      showScore: playerCount === 2,
    });
  }

  /* ➌ ───────────────────── post-processing & sorting ───────────────────── */
  for (const match of matchesMap.values()) {
    match.leaderboard.sort((a, b) => a.result - b.result);

    const topScore = match.leaderboard[0].score;
    const topScorers = match.leaderboard.filter((p) => p.score === topScore);
    const isUserTopScorer = topScorers.some((p) => p.userId === userId);

    if (topScorers.length > 1 && isUserTopScorer) match.result = "draw";
    else if (topScorers[0].userId === userId) match.result = "win";
  }

  /* now matchDate is already a number, so plain subtraction works */
  const result = [...matchesMap.values()].sort(
    (a, b) => b.matchDate - a.matchDate,
  );

  fastify.log.debug(
    `Match history for user ${userId}: ${JSON.stringify(result)}`,
  );
  return result;
};
