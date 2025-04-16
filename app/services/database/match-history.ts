import { FastifyInstance } from "fastify";

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  const db = fastify.sqlite;
  const query = `
      SELECT r1.matchId,
             m.gameName,
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

  // Parse the result into a structured format
  const matches = rows.reduce((acc, row) => {
    const { matchId, gameName, username, score } = row;

    if (!acc[matchId]) {
      acc[matchId] = {
        matchId,
        gameName,
        leaderboard: [],
      };
    }

    acc[matchId].leaderboard.push({ username, score });

    // Sort the leaderboard by score in descending order
    acc[matchId].leaderboard.sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score,
    );

    return acc;
  }, {});

  fastify.log.debug(
    `Match history for user ${userId}: ${JSON.stringify(matches)}`,
  );
  // Convert the object to an array
  return Object.values(matches);
};
