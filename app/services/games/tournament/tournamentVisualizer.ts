import type { FastifyInstance } from "fastify";
import TournamentManager from "./TournamentManager";
import type {
  PlayerInfos,
  TournamentInfos,
  MatchInfos,
} from "../../../types/tournament/tournament";
import { MatchResults } from "../../../types/strategy/ITournamentBracketGenerator";

export async function hydratePlayerScores(
  tourney: TournamentInfos,
  fastify: FastifyInstance,
): Promise<TournamentInfos> {
  const db = fastify.sqlite;

  /* ────────────────────────────────────────────────────────────────
   * 1 ─ Collect the gameIds that *still* need scores
   *     and create a lookup so we can find the match quickly later.
   * ────────────────────────────────────────────────────────────── */
  // type MatchAndIndex = { match: MatchInfos; gameIndex: number };
  const gid2Match: Map<string, MatchInfos> = new Map();
  const missingGameIds = new Set<string>();

  tourney.rounds.forEach((round) =>
    round.matches.forEach((match) => {
      const gids = match.gameIDs;
      if (!gids?.length) return;

      // Process all matches, not just incomplete ones
      gids.forEach((g) => {
        missingGameIds.add(g);
        gid2Match.set(g, match);
      });
    }),
  );

  if (missingGameIds.size === 0) return tourney; // nothing to do ✅

  /* ────────────────────────────────────────────────────────────────
   * 2 ─ Fetch all (gameId, playerId, score) tuples in *one* query
   * ────────────────────────────────────────────────────────────── */
  const ids = [...missingGameIds];
  const placeholders = ids.map(() => "?").join(",");

  type Row = { matchId: string; userId: string; score: number };

  const rows: Row[] = await db.all<Row[]>(
    `
      SELECT matchId, userId, score
      FROM r_users_matches
      WHERE matchId IN (${placeholders})
    `,
    ids,
  );

  const groupedByGameID: { [gameID: string]: MatchResults } = {};
  for (const row of rows) {
    const { matchId, userId, score } = row;

    if (score === -1) continue;

    if (!groupedByGameID[matchId]) {
      groupedByGameID[matchId] = {};
    }

    if (!groupedByGameID[matchId][userId]) {
      groupedByGameID[matchId][userId] = [];
    }

    groupedByGameID[matchId][userId].push(score);
  }

  for (const matchId in groupedByGameID) {
    const players = Object.keys(groupedByGameID[matchId]);
    if (players.length === 2) {
      const [p1, p2] = players;
      const temp = groupedByGameID[matchId][p1];
      groupedByGameID[matchId][p1] = groupedByGameID[matchId][p2];
      groupedByGameID[matchId][p2] = temp;
    }
  }

  const groupedByMatchID: { [mathID: string]: MatchResults } = {};
  tourney.rounds.forEach((round) => {
    round.matches.forEach((match) => {
      if (!match.gameIDs || match.gameIDs.length === 0) return;
      groupedByMatchID[match.id] = {};

      // Get all games results in the match
      // const allGamesResults: MatchResults = {};
      match.players.forEach((player) => (player.score = []));

      const playerIDs = match.players.map((playerInfos) => playerInfos.id);

      for (const gameID of match.gameIDs) {
        if (!gameID) continue;

        const gameResults = groupedByGameID[gameID];
        if (!gameResults) continue;

        for (const playerID of playerIDs) {
          const player = match.players.find((player) => player.id === playerID);
          if (!player || !gameResults[playerID]) continue;
          player.score.push(...gameResults[playerID]);
        }
      }
    });
  });

  return tourney;
}
export async function hydrateMatchStartTimes(
  tourney: TournamentInfos,
  fastify: FastifyInstance,
): Promise<TournamentInfos> {
  const db = fastify.sqlite;

  const gameId2Match = new Map<string, MatchInfos>();

  tourney.rounds.forEach((round) =>
    round.matches.forEach((match) => {
      const ids = match.gameIDs;
      match.tournamentId = tourney.id;
      if (!ids?.length) return;
      const lastGameId = ids[ids.length - 1];
      gameId2Match.set(lastGameId, match);
    }),
  );

  if (gameId2Match.size === 0) return tourney;

  const gameIds = [...gameId2Match.keys()];
  const placeholders = gameIds.map(() => "?").join(",");

  // Update type to match database column name
  type Row = { id: string; matchDate: string };
  const rows: Row[] = await db.all<Row[]>(
    `
      SELECT id, matchDate || ' UTC' AS matchDate
      FROM matches
      WHERE id IN (${placeholders})
    `,
    gameIds,
  );

  rows.forEach((row) => {
    const match = gameId2Match.get(row.id);
    if (match) match.startTime = row.matchDate; // Use matchDate instead of start_time
    // console.log(`Match ${row.id} start time: ${row.matchDate}`);
  });

  return tourney;
}
async function hydrateTournamentPlayers(
  tourney: TournamentInfos,
  fastify: FastifyInstance,
): Promise<TournamentInfos> {
  const db = fastify.sqlite;

  /** 1 ─ Gather every distinct playerId we still need */
  const pendingIds = new Set<string>();

  tourney.rounds.forEach((r) =>
    r.matches.forEach((m) =>
      m.players.forEach((p) => {
        if (p.isReady && !p.name) pendingIds.add(p.id);
      }),
    ),
  );

  if (pendingIds.size === 0) return tourney; // nothing to do ✅

  /** 2 ─ Fetch them all at once */
  const ids = [...pendingIds];
  console.dir(ids);
  const placeholders = ids.map(() => "?").join(",");
  type Row = {
    id: string;
    username: string;
  };

  const rows: Row[] = await db.all<Row[]>(
    `
      SELECT id, username
      FROM users
      WHERE id IN (${placeholders})
    `,
    ids,
  );
  console.dir(rows);
  const byId = new Map(rows.map((r) => [r.id, r]));
  console.dir(byId, { depth: null });

  /** 3 ─ Merge back into every player slot */
  const applyRow = (p: PlayerInfos) => {
    const row = byId.get(p.id);
    if (!row) return;

    p.name = row.username;
  };

  tourney.rounds.forEach((r) =>
    r.matches.forEach((m) => m.players.forEach(applyRow)),
  );

  return tourney;
}

export const getCurrentTournamentInfo = async (
  fastify: FastifyInstance,
  manager: TournamentManager,
) => {
  let tournament = manager.getCurrentTournamentInfos();
  if (!tournament) {
    return undefined;
  }

  tournament = await hydrateTournamentPlayers(tournament, fastify);
  tournament = await hydrateMatchStartTimes(tournament, fastify);
  tournament = await hydratePlayerScores(tournament, fastify);

  return tournament;
};
