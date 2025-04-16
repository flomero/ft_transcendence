import { FastifyInstance } from "fastify";

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  const db = fastify.sqlite;
  const query = `
      SELECT r1.matchId,
             m.gameName,
             m.matchDate,
             r2.userId,
             u.username,
             r2.score
      FROM r_users_matches r1
               JOIN r_users_matches r2
                    ON r1.matchId = r2.matchId
               JOIN users u
                    ON u.id = r2.userId
               JOIN matches m
                    ON m.id = r1.matchId
      WHERE r1.userId = ?;
  `;

  const rows = await db.all(query, userId);

  const matches = rows.reduce((acc, row) => {
    const { matchId, gameName, matchDate, username, score, userId } = row;

    if (!acc[matchId]) {
      acc[matchId] = {
        matchId,
        gameName,
        matchDate,
        leaderboard: [],
        result: "loss", // Default result
      };
    }

    acc[matchId].leaderboard.push({ userId, username, score });

    // Sort the leaderboard by score in descending order
    acc[matchId].leaderboard.sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score,
    );

    return acc;
  }, {});

  // Determine the result for each match
  Object.values(matches).forEach((match: any) => {
    const topScore = match.leaderboard[0].score;
    const topScorers = match.leaderboard.filter(
      (player: { score: number }) => player.score === topScore,
    );

    if (topScorers.length > 1) {
      match.result = "draw"; // Multiple players with the top score
    } else if (topScorers[0].userId === userId) {
      match.result = "win"; // User has the highest score
    }
  });

  fastify.log.debug(
    `Match history for user ${userId}: ${JSON.stringify(matches)}`,
  );

  return Object.values(matches);
};
