// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";
import type { Edge, Round } from "../../types/tournament/tournament";
import { MatchStatus } from "../../types/tournament/tournament";

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
              { id: "1", name: "Player 1", score: 21 },
              { id: "2", name: "Player 2", score: 15 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T10:00:00Z",
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Player 3", score: 18 },
              { id: "4", name: "Player 4", score: 21 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T10:00:00Z",
          },
          {
            name: "Match 3",
            players: [
              { id: "5", name: "Player 5", score: 21 },
              { id: "6", name: "Player 6", score: 19 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T11:00:00Z",
          },
          {
            name: "Match 4",
            players: [
              { id: "7", name: "Player 7", score: 14 },
              { id: "8", name: "Player 8", score: 21 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T11:00:00Z",
          },
        ],
      },
      {
        name: "Semifinals",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Player 1", score: 15 },
              { id: "4", name: "Player 4", score: 12 },
            ],
            status: MatchStatus.ONGOING,
            startTime: "2025-04-28T12:00:00Z",
            previousRoundInfo: "Winner of Match 1 vs Winner of Match 2",
          },
          {
            name: "Match 2",
            players: [
              { id: "5", name: "Player 5", score: 21 },
              { id: "8", name: "Player 8", score: 18 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2025-04-12T00:00:00Z",
            previousRoundInfo: "Winner of Match 3 vs Winner of Match 4",
          },
        ],
      },
      {
        name: "Final",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "0", name: "Winner of Semifinal 1", score: 0 },
              { id: "5", name: "Player 5", score: 0 },
            ],
            status: MatchStatus.NOT_STARTED,
            previousRoundInfo: "Winner of Semifinal 1 vs Winner of Semifinal 2",
          },
        ],
      },
      {
        name: "Final",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "0", name: "Winner of Semifinal 1", score: 0 },
              { id: "5", name: "Player 5", score: 0 },
            ],
            status: MatchStatus.NOT_STARTED,
            previousRoundInfo: "Winner of Semifinal 1 vs Winner of Semifinal 2",
          },
        ],
        isCurrent: true,
      },
      {
        name: "Final",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "0", name: "Winner of Semifinal 1", score: 0 },
              { id: "5", name: "Player 5", score: 0 },
            ],
            status: MatchStatus.NOT_STARTED,
            previousRoundInfo: "Winner of Semifinal 1 vs Winner of Semifinal 2",
          },
        ],
      },
      {
        name: "Final",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "0", name: "Winner of Semifinal 1", score: 0 },
              { id: "5", name: "Player 5", score: 0 },
            ],
            status: MatchStatus.NOT_STARTED,
            previousRoundInfo: "Winner of Semifinal 1 vs Winner of Semifinal 2",
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
