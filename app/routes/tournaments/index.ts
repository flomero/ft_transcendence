// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";

interface BracketQuery {
  auto?: string; // "true" | "false" | (undefined → default)
  partial?: string; // "true" | "false" | (undefined → default)
}

interface Player {
  id: string;
  name: string;
}

interface Match {
  players: Player[];
  id?: string; // Assigned dynamically
  name?: string; // Optional name for the match
}

interface Round {
  name: string;
  matches: Match[];
}

type Edge = [string, string] | [string, string, number];

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
              { id: "1", name: "Player A" },
              { id: "2", name: "Player B" },
            ],
          },
          {
            players: [
              { id: "3", name: "Player C" },
              { id: "4", name: "Player D" },
            ],
          },
          {
            players: [
              { id: "5", name: "Player E" },
              { id: "6", name: "Player F" },
            ],
          },
          {
            players: [
              { id: "7", name: "Player G" },
              { id: "8", name: "Player H" },
            ],
          },
          {
            players: [
              { id: "7", name: "Player G" },
              { id: "8", name: "Player H" },
            ],
          },
          {
            players: [
              { id: "7", name: "Player G" },
              { id: "8", name: "Player H" },
            ],
          },
        ],
      },
      {
        name: "Quarterfinals",
        matches: [
          {
            players: [
              { id: "9", name: "Winner 1" },
              { id: "10", name: "Winner 2" },
            ],
          },
          {
            players: [
              { id: "11", name: "Winner 3" },
              { id: "12", name: "Winner 4" },
            ],
          },
          {
            players: [
              { id: "11", name: "Winner 3" },
              { id: "12", name: "Winner 4" },
            ],
          },
          {
            players: [
              { id: "11", name: "Winner 3" },
              { id: "12", name: "Winner 4" },
            ],
          },
        ],
      },
      {
        name: "Semifinals",
        matches: [
          {
            players: [
              { id: "13", name: "Winner QF‑1" },
              { id: "14", name: "Winner QF‑2" },
            ],
          },
          {
            players: [
              { id: "13", name: "Winner QF‑1" },
              { id: "14", name: "Winner QF‑2" },
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
