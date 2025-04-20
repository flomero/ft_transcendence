// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";

interface BracketQuery {
  auto?: string; // "true" | "false" | (undefined → default)
}

const profile: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: BracketQuery }>("/", async (request, reply) => {
    /* ----- tournament data (whatever size you like) ----- */
    const rawRounds = [
      [
        { teamA: "Team A", teamB: "Team B" },
        { teamA: "Team C", teamB: "Team D" },
        { teamA: "Team E", teamB: "Team F" },
        { teamA: "Team G", teamB: "Team H" },
        { teamA: "Team I", teamB: "Team J" },
        { teamA: "Team K", teamB: "Team L" },
      ],
      [
        { teamA: "Winner 1", teamB: "Winner 2" },
        { teamA: "Winner 3", teamB: "Winner 4" },
        { teamA: "Winner 5", teamB: "Winner 6" },
        { teamA: "Winner 7", teamB: "Winner 8" },
      ],
      [
        { teamA: "Winner QF‑1", teamB: "Winner QF‑2" },
        { teamA: "Winner QF‑3", teamB: "Winner QF‑4" },
      ],
      [{ teamA: "Winner SF‑1", teamB: "Winner SF‑2" }],
    ];

    /* ----- assign stable DOM ids ----- */
    const rounds = rawRounds.map((round, r) =>
      round.map((m, i) => ({ ...m, id: `r${r}m${i}` })),
    );

    /* ----- decide connection strategy ----- */
    const auto = request.query.auto !== "false"; // default = auto=true

    let connectionConfig:
      | { auto: true }
      | { auto: false; edges: [string, string][] };

    if (auto) {
      connectionConfig = { auto: true };
    } else {
      // explicit list built *after* IDs exist:
      const edges: [string, string][] = [
        ["r0m0", "r1m0"],
        ["r0m1", "r1m0"],
        ["r0m2", "r1m1"],
        ["r0m3", "r1m1"],
        ["r0m4", "r1m2"],
        ["r0m5", "r1m2"],
        ["r1m0", "r2m0"],
        ["r1m1", "r2m0"],
        ["r1m2", "r2m1"],
        ["r1m3", "r2m1"],
        ["r2m0", "r3m0"],
        ["r2m1", "r3m0"],
      ];
      connectionConfig = { auto: false, edges };
    }

    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view(
      "views/tournaments",
      { rounds, connectionConfig },
      viewOptions,
    );
  });
};

export default profile;
