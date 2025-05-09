import type { FastifyInstance } from "fastify";
import { tournaments } from "./new/newTournamentHandler";
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

      // Only bother if somebody's score array is incomplete
      const needsHydration = match.players.some(
        (pl) => (pl.score?.length ?? 0) < gids.length,
      );
      if (!needsHydration) return;

      gids.forEach((g, idx) => {
        missingGameIds.add(g);
        gid2Match.set(g, { match, gameIndex: idx });
      });

      // Pre-allocate score arrays so we can assign by index
      match.players.forEach((pl) => {
        if (pl.score.length < gids.length) {
          pl.score = Array(gids.length).fill(0);
        }
      });
    }),
  );

  if (missingGameIds.size === 0) return tourney; // nothing to do ✅

  /* ────────────────────────────────────────────────────────────────
   * 2 ─ Fetch all (gameId, playerId, score) tuples in *one* query
   * ────────────────────────────────────────────────────────────── */
  const ids = [...missingGameIds];
  const placeholders = ids.map(() => "?").join(",");

  type Row = { gameId: string; playerId: string; score: number };

  const rows: Row[] = await db.all<Row[]>(
    `
      SELECT matchId , userId, score
        FROM r_users_matches              -- ⇠ rename if your table differs
       WHERE matchId IN (${placeholders})
    `,
    ids,
  );

  /* ────────────────────────────────────────────────────────────────
   * 3 ─ Merge back into the TournamentInfos structure
   * ────────────────────────────────────────────────────────────── */
  rows.forEach((row) => {
    const meta = gid2Match.get(row.gameId);
    if (!meta) return;

    const { match, gameIndex } = meta;
    const player: PlayerInfos | undefined = match.players.find(
      (p) => p.id === row.playerId,
    );
    if (player) player.score[gameIndex] = row.score;
  });

  return tourney;
}

export async function hydrateMatchStartTimes(
  tourney: TournamentInfos,
  fastify: FastifyInstance,
): Promise<TournamentInfos> {
  const db = fastify.sqlite;

  /** 1 ─ Collect “latest gameId” → MatchInfos */
  const gameId2Match = new Map<string, MatchInfos>();

  tourney.rounds.forEach((round) =>
    round.matches.forEach((match) => {
      if (match.startTime) return; // already hydrated
      const ids = match.gameIDs;
      if (!ids?.length) return; // nothing we can do
      const lastGameId = ids[ids.length - 1]; // newest game
      gameId2Match.set(lastGameId, match);
    }),
  );

  if (gameId2Match.size === 0) return tourney; // all done ✅

  /** 2 ─ Grab all start times in one go */
  const gameIds = [...gameId2Match.keys()];
  const placeholders = gameIds.map(() => "?").join(",");

  type Row = { id: string; start_time: string }; // adjust column name if needed
  const rows: Row[] = await db.all<Row[]>(
    `
      SELECT id, matchDate
        FROM matches
       WHERE id IN (${placeholders})
    `,
    gameIds,
  );

  /** 3 ─ Merge back into the structure */
  rows.forEach((row) => {
    const match = gameId2Match.get(row.id);
    if (match) match.startTime = row.start_time; // ISO string straight from DB
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
  const placeholders = ids.map(() => "?").join(",");
  type Row = {
    id: string;
    name: string;
  };

  const rows: Row[] = await db.all<Row[]>(
    `
        SELECT id, username
        FROM users
        WHERE id IN (${placeholders})
    `,
    ids,
  );

  const byId = new Map(rows.map((r) => [r.id, r]));

  /** 3 ─ Merge back into every player slot */
  const applyRow = (p: PlayerInfos) => {
    const row = byId.get(p.id);
    if (!row) return;

    p.name = row.name;
  };

  tourney.rounds.forEach((r) =>
    r.matches.forEach((m) => m.players.forEach(applyRow)),
  );

  return tourney;
}

export const getCurrentTournamentInfo = async (
  fastify: FastifyInstance,
  tournamentId: string,
) => {
  const tManager: TournamentManager | undefined = tournaments.get(tournamentId);

  if (!tManager) {
    throw new Error("Tournament not found");
  }
  let tournament: TournamentInfos | undefined =
    tManager.getCurrentTournamentInfos();
  if (!tournament) {
    throw new Error("Tournament not found");
  }

  tournament = await hydrateTournamentPlayers(tournament, fastify);
  tournament = await hydrateMatchStartTimes(tournament, fastify);
  tournament = await hydratePlayerScores(tournament, fastify);

  console.dir(tournament, { depth: null });
};
