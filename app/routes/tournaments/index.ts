// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";
import { Edge, Round } from "../../types/tournament/tournament";

interface BracketQuery {
  auto?: string; // "true" | "false" | (undefined → default)
  partial?: string; // "true" | "false" | (undefined → default)
}

const profile: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: BracketQuery }>("/", async (request, reply) => {
    /* ----- tournament data (variable players per match) ----- */
    const rawRounds: Round[] = [
      {
        name: "Round 1",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Alice", score: 15 },
              { id: "2", name: "Bob", score: 10 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Charlie", score: 20 },
              { id: "4", name: "David", score: 5 },
            ],
          },
          {
            name: "Match 3",
            players: [
              { id: "5", name: "Eve", score: 18 },
              { id: "6", name: "Frank", score: 12 },
            ],
          },
          {
            name: "Match 4",
            players: [
              { id: "7", name: "Grace", score: 25 },
              { id: "8", name: "Hank", score: 8 },
            ],
          },
        ],
      },
      {
        name: "Semifinals",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Alice", score: 22 },
              { id: "3", name: "Charlie", score: 18 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "5", name: "Eve", score: 20 },
              { id: "7", name: "Grace", score: 15 },
            ],
          },
        ],
      },
      {
        name: "Finals",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Alice", score: 30 },
              { id: "5", name: "Eve", score: 25 },
            ],
          },
        ],
      },
    ];

    /* ----- assign stable DOM ids ----- */
    const rounds: Round[] = rawRounds.map((round, r) => ({
      ...round,
      matches: round.matches.map((match, i) => ({
        ...match,
        id: `r${r}m${i}`,
      })),
    }));

    /* ----- decide connection strategy ----- */
    const auto = request.query.auto !== "false"; // default = auto=true

    let connectionConfig: { auto: true } | { auto: false; edges: Edge[] };

    if (auto) {
      connectionConfig = { auto: true };
    } else {
      const edges: Edge[] = [
        ["r0m0", "r1m0", -10],
        ["r0m1", "r1m0", -10],
        ["r0m2", "r1m1", 10],
        ["r0m3", "r1m1", 10],
        ["r1m0", "r2m0"],
        ["r1m1", "r2m0"],
        ["r1m2", "r2m1"],
        ["r1m3", "r2m1"],
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
