import { FastifyInstance } from "fastify";

export const getMatchHistoryService = async (
  fastify: FastifyInstance,
  userId: string,
) => {
  // Simulate fetching match history (replace with actual database query later)
  const matches = [
    { date: "2023-10-01", opponent: "Player1", result: "Win" },
    { date: "2023-09-28", opponent: "Player2", result: "Loss" },
    { date: "2023-09-25", opponent: "Player3", result: "Win" },
  ];

  return matches;
};
