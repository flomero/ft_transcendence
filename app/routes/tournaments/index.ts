import type { FastifyPluginAsync } from "fastify";
import type { Edge, TournamentInfos } from "../../types/tournament/tournament";
import {
  MatchStatus,
  TournamentStatus,
} from "../../types/tournament/tournament";

interface BracketQuery {
  auto?: string; // ?auto=false      ➜ manual edges
  partial?: string; // (left intact – not used here)
}

const tournamentsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Querystring: BracketQuery }>("/", async (request, reply) => {
    const tournaments: TournamentInfos[] = [
      {
        id: "t1",
        state: TournamentStatus.ON_GOING,
        playerCount: 8,
        type: "SINGLE_ELIMINATION",
        rounds: [
          /* ──────────────────────────  ROUND 1  ────────────────────────── */
          {
            name: "Round 1",
            matches: [
              {
                id: "t1-r1-m1",
                players: [
                  {
                    id: "1",
                    name: "Player 1",
                    isReady: true,
                    score: [11, 3, 11],
                    winCount: 2,
                  },
                  {
                    id: "2",
                    name: "Player 2",
                    isReady: true,
                    score: [5, 11, 9],
                    winCount: 1,
                  },
                ],
                gameIDs: ["t1-g1", "t1-g2", "t1-g3"],
                gameWinners: [0, 0, 0], // playerId’s as numbers
                leadPlayer: 1,
                status: MatchStatus.COMPLETED,
                startTime: "2024-03-20T10:00:00Z",
              },
              {
                id: "t1-r1-m2",
                players: [
                  {
                    id: "3",
                    name: "Player 3",
                    isReady: true,
                    score: [0, 0],
                    winCount: 0,
                  },
                  {
                    id: "4",
                    name: "Player 4",
                    isReady: true,
                    score: [11, 11],
                    winCount: 2,
                  },
                ],
                gameIDs: ["t1-g4", "t1-g5"],
                gameWinners: [1, 0],
                leadPlayer: 0,
                status: MatchStatus.COMPLETED,
                startTime: "2024-03-20T10:00:00Z",
              },
              {
                id: "t1-r1-m3",
                players: [
                  {
                    id: "5",
                    name: "Player 5",
                    isReady: true,
                    score: [1, 11, 3],
                    winCount: 1,
                  },
                  {
                    id: "6",
                    name: "Player 6",
                    isReady: true,
                    score: [11, 9, 11],
                    winCount: 2,
                  },
                ],
                gameIDs: ["t1-g6", "t1-g7", "t1-g8"],
                gameWinners: [1, 0, 1],
                leadPlayer: 1,
                status: MatchStatus.COMPLETED,
                startTime: "2024-03-20T11:00:00Z",
              },
              {
                id: "t1-r1-m4",
                players: [
                  {
                    id: "7",
                    name: "Player 7",
                    isReady: true,
                    score: [6, 11, 11],
                    winCount: 2,
                  },
                  {
                    id: "8",
                    name: "Player 8",
                    isReady: true,
                    score: [11, 8, 7],
                    winCount: 1,
                  },
                ],
                gameIDs: ["t1-g9", "t1-g10", "t1-g11"],
                gameWinners: [1, 0, 0],
                leadPlayer: 1,
                status: MatchStatus.COMPLETED,
                startTime: "2024-03-20T11:00:00Z",
              },
            ],
          },

          /* ─────────────────────────  SEMI-FINALS  ─────────────────────── */
          {
            name: "Semifinals",
            isCurrent: true,
            matches: [
              {
                id: "t1-sf-m1",
                players: [
                  {
                    id: "1",
                    name: "Player 1",
                    isReady: true,
                    score: [11],
                    winCount: 1,
                  },
                  {
                    id: "4",
                    name: "Player 4",
                    isReady: true,
                    score: [2],
                    winCount: 0,
                  },
                ],
                gameIDs: ["t1-g12"],
                gameWinners: [1],
                leadPlayer: 1,
                currentGame: 1, // second game about to start
                status: MatchStatus.ONGOING,
                startTime: "2025-04-28T12:00:00Z",
              },
              {
                id: "t1-sf-m2",
                players: [
                  {
                    id: "5",
                    name: "Player 5",
                    isReady: false,
                    score: [11, 11],
                    winCount: 2,
                  },
                  {
                    id: "8",
                    name: "Player 8",
                    isReady: false,
                    score: [8, 5],
                    winCount: 0,
                  },
                ],
                gameIDs: ["t1-g13", "t1-g14"],
                gameWinners: [5, 5],
                leadPlayer: 0,
                status: MatchStatus.COMPLETED,
                startTime: "2025-04-12T00:00:00Z",
              },
            ],
          },

          /* ────────────────────────────  FINAL  ────────────────────────── */
          {
            name: "Final",
            matches: [
              {
                id: "t1-f-m1",
                players: [
                  {
                    id: "0",
                    name: "Winner SF-1",
                    isReady: false,
                    score: [],
                    winCount: 0,
                  },
                  {
                    id: "5",
                    name: "Player 5",
                    isReady: false,
                    score: [],
                    winCount: 0,
                  },
                ],
                gameIDs: [], // best-of-X not started yet
                gameWinners: [],
                leadPlayer: -1, // tie/no leader
                currentGame: 0,
                status: MatchStatus.NOT_STARTED,
              },
            ],
          },
        ],

        /* edges that tie the bracket together */
        seeding: <Edge[]>[
          ["t1", "r1-m1", "sf-m1"],
          ["t1", "r1-m2", "sf-m1"],
          ["t1", "r1-m3", "sf-m2"],
          ["t1", "r1-m4", "sf-m2"],
          ["t1", "sf-m1", "f-m1"],
          ["t1", "sf-m2", "f-m1"],
        ],
      },

      /* ─────────────────────────────  EMPTY SKELETONS  ───────────────────────────── */
      {
        id: "t2",
        state: TournamentStatus.CREATED,
        playerCount: 16,
        type: "DOUBLE_ELIMINATION",
        rounds: [],
        seeding: [],
      },
      {
        id: "t3",
        state: TournamentStatus.FINISHED,
        playerCount: 4,
        type: "SINGLE_ELIMINATION",
        rounds: [],
        seeding: [],
      },
    ];

    console.dir(tournaments[0], { depth: null });

    /* ---------- render ---------- */
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view("views/tournaments", { tournaments }, viewOptions);
  });
};

export default tournamentsRoute;
