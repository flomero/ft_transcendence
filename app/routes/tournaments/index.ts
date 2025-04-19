// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";

const profile: FastifyPluginAsync = async (fastify) => {
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

    /* add machine‑friendly IDs that stay stable no matter
       what the names are */
    const rounds = rawRounds.map((round, r) =>
      round.map((m, i) => ({
        ...m,
        id: `r${r}m${i}`, //  r = round index, m = match index
      })),
    );

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournaments", { rounds }, viewOptions);
  });
};

export default profile;
