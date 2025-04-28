// routes/profile.ts
import type { FastifyPluginAsync } from "fastify";
import type { Edge, Round } from "../../types/tournament/tournament";

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
              { id: "1", name: "Player 1", score: 0 },
              { id: "2", name: "Player 2", score: 0 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Player 3", score: 0 },
              { id: "4", name: "Player 4", score: 0 },
            ],
          },
          {
            name: "Match 3",
            players: [
              { id: "5", name: "Player 5", score: 0 },
              { id: "6", name: "Player 6", score: 0 },
            ],
          },
          {
            name: "Match 4",
            players: [
              { id: "7", name: "Player 7", score: 0 },
              { id: "8", name: "Player 8", score: 0 },
            ],
          },
          {
            name: "Match 5",
            players: [
              { id: "9", name: "Player 9", score: 0 },
              { id: "10", name: "Player 10", score: 0 },
            ],
          },
          {
            name: "Match 6",
            players: [
              { id: "11", name: "Player 11", score: 0 },
              { id: "12", name: "Player 12", score: 0 },
            ],
          },
          {
            name: "Match 7",
            players: [
              { id: "13", name: "Player 13", score: 0 },
              { id: "14", name: "Player 14", score: 0 },
            ],
          },
          {
            name: "Match 8",
            players: [
              { id: "15", name: "Player 15", score: 0 },
              { id: "16", name: "Player 16", score: 0 },
            ],
          },
          {
            name: "Match 9",
            players: [
              { id: "17", name: "Player 17", score: 0 },
              { id: "18", name: "Player 18", score: 0 },
            ],
          },
          {
            name: "Match 10",
            players: [
              { id: "19", name: "Player 19", score: 0 },
              { id: "20", name: "Player 20", score: 0 },
            ],
          },
          {
            name: "Match 11",
            players: [
              { id: "21", name: "Player 21", score: 0 },
              { id: "22", name: "Player 22", score: 0 },
            ],
          },
          {
            name: "Match 12",
            players: [
              { id: "23", name: "Player 23", score: 0 },
              { id: "24", name: "Player 24", score: 0 },
            ],
          },
          {
            name: "Match 13",
            players: [
              { id: "25", name: "Player 25", score: 0 },
              { id: "26", name: "Player 26", score: 0 },
            ],
          },
          {
            name: "Match 14",
            players: [
              { id: "27", name: "Player 27", score: 0 },
              { id: "28", name: "Player 28", score: 0 },
            ],
          },
          {
            name: "Match 15",
            players: [
              { id: "29", name: "Player 29", score: 0 },
              { id: "30", name: "Player 30", score: 0 },
            ],
          },
          {
            name: "Match 16",
            players: [
              { id: "31", name: "Player 31", score: 0 },
              { id: "32", name: "Player 32", score: 0 },
            ],
          },
        ],
      },
      {
        name: "Round 2",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Winner of Match 1", score: 0 },
              { id: "2", name: "Winner of Match 2", score: 0 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Winner of Match 3", score: 0 },
              { id: "4", name: "Winner of Match 4", score: 0 },
            ],
          },
          {
            name: "Match 3",
            players: [
              { id: "5", name: "Winner of Match 5", score: 0 },
              { id: "6", name: "Winner of Match 6", score: 0 },
            ],
          },
          {
            name: "Match 4",
            players: [
              { id: "7", name: "Winner of Match 7", score: 0 },
              { id: "8", name: "Winner of Match 8", score: 0 },
            ],
          },
          {
            name: "Match 5",
            players: [
              { id: "9", name: "Winner of Match 9", score: 0 },
              { id: "10", name: "Winner of Match 10", score: 0 },
            ],
          },
          {
            name: "Match 6",
            players: [
              { id: "11", name: "Winner of Match 11", score: 0 },
              { id: "12", name: "Winner of Match 12", score: 0 },
            ],
          },
          {
            name: "Match 7",
            players: [
              { id: "13", name: "Winner of Match 13", score: 0 },
              { id: "14", name: "Winner of Match 14", score: 0 },
            ],
          },
          {
            name: "Match 8",
            players: [
              { id: "15", name: "Winner of Match 15", score: 0 },
              { id: "16", name: "Winner of Match 16", score: 0 },
            ],
          },
        ],
      },
      {
        name: "Round 3",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Winner of Match 1", score: 0 },
              { id: "2", name: "Winner of Match 2", score: 0 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Winner of Match 3", score: 0 },
              { id: "4", name: "Winner of Match 4", score: 0 },
            ],
          },
          {
            name: "Match 3",
            players: [
              { id: "5", name: "Winner of Match 5", score: 0 },
              { id: "6", name: "Winner of Match 6", score: 0 },
            ],
          },
          {
            name: "Match 4",
            players: [
              { id: "7", name: "Winner of Match 7", score: 0 },
              { id: "8", name: "Winner of Match 8", score: 0 },
            ],
          },
        ],
      },
      {
        name: "Round 4",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Winner of Match 1", score: 0 },
              { id: "2", name: "Winner of Match 2", score: 0 },
            ],
          },
          {
            name: "Match 2",
            players: [
              { id: "3", name: "Winner of Match 3", score: 0 },
              { id: "4", name: "Winner of Match 4", score: 0 },
            ],
          },
        ],
      },
      {
        name: "Round 5",
        matches: [
          {
            name: "Match 1",
            players: [
              { id: "1", name: "Winner of Match 1", score: 0 },
              { id: "2", name: "Winner of Match 2", score: 0 },
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
