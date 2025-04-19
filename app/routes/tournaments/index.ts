import type { FastifyPluginAsync } from "fastify";

const profile: FastifyPluginAsync = async (fastify): Promise<void> => {
  const generateStructuredTournament = (rounds: any[][]) => {
    return rounds.map((round, roundIndex) => {
      if (roundIndex === 0) {
        // First round: no spacing
        return round.map((match) => ({ ...match }));
      }

      const matchBoxHeight = 60;
      const matchGap = 40;
      const matchSpacing = (matchBoxHeight + matchGap) * 2 ** (roundIndex - 1);

      return round.map((match) => {
        const spacerTop = matchSpacing / 2 - matchBoxHeight / 2;
        return {
          ...match,
          spacerTop,
        };
      });
    });
  };

  fastify.get("/", async (request, reply) => {
    const rawRounds = [
      [
        { teamA: "Team A", teamB: "Team B" },
        { teamA: "Team C", teamB: "Team D" },
        { teamA: "Team E", teamB: "Team F" },
        { teamA: "Team G", teamB: "Team H" },
      ],
      [
        { teamA: "Winner 1", teamB: "Winner 2" },
        { teamA: "Winner 3", teamB: "Winner 4" },
      ],
      [{ teamA: "Semifinalist A", teamB: "Semifinalist B" }],
    ];

    const structuredRounds = generateStructuredTournament(rawRounds);

    const tournament = {
      rounds: structuredRounds,
    };

    console.log(tournament);
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournaments", { tournament }, viewOptions);
  });
};

export default profile;
