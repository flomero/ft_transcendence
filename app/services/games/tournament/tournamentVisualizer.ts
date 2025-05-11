import type { FastifyInstance } from "fastify";
import TournamentManager from "./TournamentManager";
import type {
  PlayerInfos,
  TournamentInfos,
  MatchInfos,
} from "../../../types/tournament/tournament";

export async function hydratePlayerScores(
  tourney: TournamentInfos,
  fastify: FastifyInstance,
): Promise<TournamentInfos> {
  const db = fastify.sqlite;

  /* ────────────────────────────────────────────────────────────────
   * 1 ─ Collect the gameIds that *still* need scores
   *     and create a lookup so we can find the match quickly later.
   * ────────────────────────────────────────────────────────────── */
  type MatchAndIndex = { match: MatchInfos; gameIndex: number };
  const gid2Match: Map<string, MatchAndIndex> = new Map();
  const missingGameIds = new Set<string>();

  tourney.rounds.forEach((round) =>
    round.matches.forEach((match) => {
      const gids = match.gameIDs;
      if (!gids?.length) return;

      // Process all matches, not just incomplete ones
      gids.forEach((g, idx) => {
        missingGameIds.add(g);
        gid2Match.set(g, { match, gameIndex: idx });
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
  console.log("Rows from DB:");
  console.dir(rows);
  /* ────────────────────────────────────────────────────────────────
   * 3 ─ Merge back into the TournamentInfos structure
   * ────────────────────────────────────────────────────────────── */
  rows.forEach((row) => {
    const meta = gid2Match.get(row.matchId);
    if (!meta) return;

    const { match, gameIndex } = meta;
    const player: PlayerInfos | undefined = match.players.find(
      (p) => p.id === row.userId,
    );
    if (player) player.score[gameIndex] = row.score;
    console.log(`Match ${match.id} player ${player?.name} score: ${row.score}`);
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
    console.log(`Match ${row.id} start time: ${row.matchDate}`);
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

  console.log(`TournamentInfos from tournamentVisualizer:`);
  console.dir(tournament, { depth: null });
  return tournament;
};
