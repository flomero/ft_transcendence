import type { FastifyPluginAsync } from "fastify";
import type {
  Edge,
  RoundInfos,
  TournamentInfos,
} from "../../types/tournament/tournament";
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
    const rawRounds: RoundInfos[] = [
      {
        name: "Round 1",
        matches: [
          {
            players: [
              { id: "1", name: "Player 1", score: [11, 3, 11], winCount: 2 },
              { id: "2", name: "Player 2", score: [5, 11, 9], winCount: 1 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T10:00:00Z",
          },
          {
            players: [
              { id: "3", name: "Player 3", score: [0, 0], winCount: 0 },
              { id: "4", name: "Player 4", score: [11, 11], winCount: 2 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T10:00:00Z",
          },
          {
            players: [
              { id: "5", name: "Player 5", score: [1, 11, 3], winCount: 1 },
              { id: "6", name: "Player 6", score: [11, 9, 11], winCount: 2 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T11:00:00Z",
          },
          {
            players: [
              { id: "7", name: "Player 7", score: [6, 11, 11], winCount: 2 },
              { id: "8", name: "Player 8", score: [11, 8, 7], winCount: 0 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2024-03-20T11:00:00Z",
          },
        ],
      },
      {
        name: "Semifinals",
        isCurrent: true,
        matches: [
          {
            players: [
              { id: "1", name: "Player 1", score: [11], winCount: 1 },
              { id: "4", name: "Player 4", score: [2], winCount: 0 },
            ],
            status: MatchStatus.ONGOING,
            startTime: "2025-04-28T12:00:00Z",
          },
          {
            players: [
              { id: "5", name: "Player 5", score: [11, 11], winCount: 2 },
              { id: "8", name: "Player 8", score: [8, 5], winCount: 0 },
            ],
            status: MatchStatus.COMPLETED,
            startTime: "2025-04-12T00:00:00Z",
          },
        ],
      },
      {
        name: "Final",
        matches: [
          {
            players: [
              { id: "0", name: "Winner SF-1", score: [], winCount: 0 },
              { id: "5", name: "Player 5", score: [], winCount: 0 },
            ],
            status: MatchStatus.NOT_STARTED,
          },
        ],
      },
    ];

    const tournaments: TournamentInfos[] = [
      {
        id: "t1",
        state: TournamentStatus.ON_GOING,
        playerCount: 8,
        type: "SINGLE_ELIMINATION",
        rounds: rawRounds,
      },
      {
        id: "t2",
        state: TournamentStatus.CREATED,
        playerCount: 16,
        type: "DOUBLE_ELIMINATION",
        rounds: [],
      },
      {
        id: "t3",
        state: TournamentStatus.FINISHED,
        playerCount: 4,
        type: "SINGLE_ELIMINATION",
        rounds: [],
      },
    ];

    function getPreviousMatch(
      roundID: number,
      matchID: number,
      playerID: number,
    ): { roundID: number; matchID: number } {
      if (roundID === 0) return { roundID: -1, matchID: 0 }; // No previous round

      const prevRoundID = roundID - 1;
      const matchIndexInPrevRound = matchID * 2 + playerID;

      return { roundID: prevRoundID, matchID: matchIndexInPrevRound };
    }

    tournaments.forEach((tournament) => {
      tournament.rounds.forEach((round, roundID) => {
        round.matches.forEach((match, matchID) => {
          const player0WinCount = match.players[0].winCount;
          const player1WinCount = match.players[1].winCount;

          const leadPlayer =
            player0WinCount > player1WinCount
              ? 0
              : player1WinCount > player0WinCount
                ? 1
                : -1;

          // const playersWinCount = [player1WinCount, player0WinCount]; // so index matches playerIndex

          match.players.forEach((player, playerID) => {
            const prevMatch = getPreviousMatch(roundID, matchID, playerID);
            player.isReady =
              prevMatch.roundID === -1
                ? true
                : tournament.rounds[prevMatch.roundID].matches[
                    prevMatch.matchID
                  ].status === MatchStatus.COMPLETED;
          });
          match.gameWinners = match.players[0].score.map((_, index) =>
            match.players[0].score[index] > match.players[1].score[index]
              ? 0
              : 1,
          );
          match.currentGame = match.players[0].score.length;
          match.leadPlayer = leadPlayer;
        });
      });
    });

    tournaments.forEach((tournament) => {
      tournament.rounds = tournament.rounds.map((round, r) => ({
        ...round,
        matches: round.matches.map((match, i) => ({
          ...match,
          id: `${tournament.id}-r${r}m${i}`, // Add tournament ID prefix
        })),
      }));
    });

    // console.dir(tournaments[0], {depth: null});

    /* ---------- connection strategy ---------- */
    const auto = request.query.auto !== "false";

    let connectionConfig: { auto: true } | { auto: false; edges: Edge[] };

    if (auto) {
      connectionConfig = { auto: true };
    } else {
      // manual edges for tournament t1 only
      const edges: Edge[] = [
        ["t1", "r0m0", "r1m0", -10],
        ["t1", "r0m1", "r1m0", -10],
        ["t1", "r0m2", "r1m1", 10],
        ["t1", "r0m3", "r1m1", 10],
        ["t1", "r1m0", "r2m0"],
        ["t1", "r1m1", "r2m0"],
      ];
      connectionConfig = { auto: false, edges };
    }

    /* ---------- render ---------- */
    const viewOptions = request.isAjax() ? {} : { layout: "layouts/main" };
    return reply.view(
      "views/tournaments",
      { tournaments, connectionConfig },
      viewOptions,
    );
  });
};

export default tournamentsRoute;
