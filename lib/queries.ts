import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import {
  db,
  players,
  playerStatHistory,
  ideas,
  matches,
  matchGoals,
  generatedRetas,
  generatedRetaPlayers,
  retaWords,
  playerComments,
  commentReactions,
  reports,
  playerSignups,
  type Player,
  type StatHistory,
  type Idea,
  type Match,
  type GeneratedReta,
  type RetaWord,
  type PlayerComment,
  type Report,
  type PlayerSignup,
} from "@/lib/db";
import type { Position } from "@/lib/constants";
import { rotatingWords } from "@/constants/rotatingWords";

/**
 * Maps player id → public image path for files in `public/players/`
 * (e.g. `91.png` → `/players/91.png`). Read fresh each call so newly added
 * images show up without a restart. Any extension is supported.
 */
function playerImageMap(): Map<number, string> {
  const map = new Map<number, string>();
  try {
    for (const file of readdirSync(join(process.cwd(), "public", "players"))) {
      const id = Number(file.replace(/\.[^.]+$/, ""));
      if (!Number.isNaN(id)) map.set(id, `/players/${file}`);
    }
  } catch {
    // folder missing — fall back to whatever photoUrl the rows already have
  }
  return map;
}

/** Overlays the local `public/players/<id>` image when present. */
function withLocalPhoto(player: Player, images: Map<number, string>): Player {
  const local = images.get(player.id);
  return local ? { ...player, photoUrl: local } : player;
}

/** All players, strongest first. */
export async function getPlayers(): Promise<Player[]> {
  const rows = await db.select().from(players).orderBy(desc(players.overall));
  const images = playerImageMap();
  return rows.map((p) => withLocalPhoto(p, images));
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const rows = await db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .limit(1);
  if (!rows[0]) return null;
  return withLocalPhoto(rows[0], playerImageMap());
}

/** Comments on a player, oldest first (chat order). */
export async function getPlayerComments(
  playerId: number,
): Promise<PlayerComment[]> {
  return db
    .select()
    .from(playerComments)
    .where(
      and(
        eq(playerComments.playerId, playerId),
        eq(playerComments.deleted, false),
      ),
    )
    .orderBy(asc(playerComments.createdAt));
}

/** Reaction counts per comment for a player: `{ [commentId]: { [emoji]: n } }`. */
export async function getCommentReactions(
  playerId: number,
): Promise<Record<number, Record<string, number>>> {
  const rows = await db
    .select({
      commentId: commentReactions.commentId,
      emoji: commentReactions.emoji,
      count: sql<number>`count(*)::int`,
    })
    .from(commentReactions)
    .innerJoin(
      playerComments,
      eq(commentReactions.commentId, playerComments.id),
    )
    .where(eq(playerComments.playerId, playerId))
    .groupBy(commentReactions.commentId, commentReactions.emoji);

  const out: Record<number, Record<string, number>> = {};
  for (const r of rows) {
    (out[r.commentId] ??= {})[r.emoji] = r.count;
  }
  return out;
}

/** Attribute snapshots for a player, oldest first (for charting progress). */
export async function getPlayerHistory(
  playerId: number,
): Promise<StatHistory[]> {
  return db
    .select()
    .from(playerStatHistory)
    .where(eq(playerStatHistory.playerId, playerId))
    .orderBy(asc(playerStatHistory.recordedAt));
}

export type PlayerGoalHistoryItem = {
  matchId: number;
  playedAt: string;
  teamAName: string;
  teamBName: string;
  scoreA: number;
  scoreB: number;
  balance: number;
  durationSec: number | null;
  team: string | null;
  goals: number;
};

/** Goal-scoring history for one player, newest match first. */
export async function getPlayerGoalHistory(
  playerId: number,
): Promise<PlayerGoalHistoryItem[]> {
  return db
    .select({
      matchId: matches.id,
      playedAt: matches.playedAt,
      teamAName: matches.teamAName,
      teamBName: matches.teamBName,
      scoreA: matches.scoreA,
      scoreB: matches.scoreB,
      balance: matches.balance,
      durationSec: matches.durationSec,
      team: matchGoals.team,
      goals: matchGoals.goals,
    })
    .from(matchGoals)
    .innerJoin(matches, eq(matchGoals.matchId, matches.id))
    .where(and(eq(matchGoals.playerId, playerId), gt(matchGoals.goals, 0)))
    .orderBy(desc(matches.playedAt), desc(matches.id));
}

// ── Ideas ────────────────────────────────────────────────────────────────
/** All ideas, newest first. */
export async function getIdeas(): Promise<Idea[]> {
  return db.select().from(ideas).orderBy(desc(ideas.createdAt));
}

// ── Reports ──────────────────────────────────────────────────────────────
/** Private admin reports, newest first. */
export async function getReports(): Promise<Report[]> {
  return db.select().from(reports).orderBy(desc(reports.createdAt));
}

// ── Player signups ─────────────────────────────────────────────────────────
/** Signup requests to become a player, pending first then newest. */
export async function getPlayerSignups(): Promise<PlayerSignup[]> {
  return db
    .select()
    .from(playerSignups)
    .orderBy(
      // pendientes primero, luego por fecha desc
      sql`case when ${playerSignups.status} = 'pendiente' then 0 else 1 end`,
      desc(playerSignups.createdAt),
    );
}

/** One signup by id (to prefill the new-player form). */
export async function getPlayerSignupById(
  id: number,
): Promise<PlayerSignup | null> {
  const [row] = await db
    .select()
    .from(playerSignups)
    .where(eq(playerSignups.id, id))
    .limit(1);
  return row ?? null;
}

/** How many signups are still waiting — for the admin badge. */
export async function getPendingSignupCount(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(playerSignups)
    .where(eq(playerSignups.status, "pendiente"));
  return row?.n ?? 0;
}

// ── Matches ──────────────────────────────────────────────────────────────
export type Scorer = {
  playerId: number | null;
  name: string;
  displayName: string;
  nationality: string;
  team: string | null;
  goals: number;
  isGuest: boolean;
};
export type MatchWithScorers = Match & { scorers: Scorer[] };

/** Past matches (newest first) with their goal scorers attached. */
export async function getMatches(): Promise<MatchWithScorers[]> {
  const rows = await db
    .select()
    .from(matches)
    .orderBy(desc(matches.playedAt), desc(matches.id));

  const goalRows = await db
    .select({
      matchId: matchGoals.matchId,
      playerId: matchGoals.playerId,
      guestName: matchGoals.guestName,
      team: matchGoals.team,
      goals: matchGoals.goals,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(matchGoals)
    .leftJoin(players, eq(matchGoals.playerId, players.id));

  const byMatch = new Map<number, Scorer[]>();
  for (const g of goalRows) {
    const list = byMatch.get(g.matchId) ?? [];
    const guest = g.playerId == null;
    list.push({
      playerId: g.playerId,
      name: g.name ?? g.guestName ?? "Invitado",
      displayName: g.displayName ?? g.guestName ?? g.name ?? "Invitado",
      nationality: g.nationality ?? "mx",
      team: g.team,
      goals: g.goals,
      isGuest: guest,
    });
    byMatch.set(g.matchId, list);
  }

  return rows.map((m) => ({
    ...m,
    scorers: (byMatch.get(m.id) ?? []).sort((a, b) => b.goals - a.goals),
  }));
}

/** A single match with its scorers, for the edit screen. */
export async function getMatchById(
  id: number,
): Promise<MatchWithScorers | null> {
  const [m] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, id))
    .limit(1);
  if (!m) return null;

  const goalRows = await db
    .select({
      playerId: matchGoals.playerId,
      guestName: matchGoals.guestName,
      team: matchGoals.team,
      goals: matchGoals.goals,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(matchGoals)
    .leftJoin(players, eq(matchGoals.playerId, players.id))
    .where(eq(matchGoals.matchId, id));

  return {
    ...m,
    scorers: goalRows
      .map((g) => ({
        playerId: g.playerId,
        name: g.name ?? g.guestName ?? "Invitado",
        displayName: g.displayName ?? g.guestName ?? g.name ?? "Invitado",
        nationality: g.nationality ?? "mx",
        team: g.team,
        goals: g.goals,
        isGuest: g.playerId == null,
      }))
      .sort((a, b) => b.goals - a.goals),
  };
}

export type TopScorer = {
  playerId: number;
  name: string;
  displayName: string;
  nationality: string;
  goals: number;
  matches: number;
};

/** Goal tally per player across all matches, top scorers first. */
export async function getTopScorers(): Promise<TopScorer[]> {
  const totalGoals = sql<number>`sum(${matchGoals.goals})`;
  return db
    .select({
      playerId: players.id,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
      goals: totalGoals.mapWith(Number),
      matches: sql<number>`count(distinct ${matchGoals.matchId})`.mapWith(
        Number,
      ),
    })
    .from(matchGoals)
    .innerJoin(players, eq(matchGoals.playerId, players.id))
    .groupBy(players.id, players.name, players.displayName, players.nationality)
    .having(sql`sum(${matchGoals.goals}) > 0`)
    .orderBy(desc(totalGoals));
}

// ── Generated retas ──────────────────────────────────────────────────────────
export type RecentSplit = { teamAIds: number[]; teamBIds: number[] };

/**
 * The most recent generated splits (ids per side), for feeding variety into the
 * balancer. Cheap: only ids, newest first.
 */
export async function getRecentSplits(limit = 20): Promise<RecentSplit[]> {
  const retas = await db
    .select({ id: generatedRetas.id })
    .from(generatedRetas)
    .orderBy(desc(generatedRetas.createdAt))
    .limit(limit);
  if (retas.length === 0) return [];

  const rows = await db
    .select({
      retaId: generatedRetaPlayers.retaId,
      playerId: generatedRetaPlayers.playerId,
      team: generatedRetaPlayers.team,
    })
    .from(generatedRetaPlayers)
    .where(
      inArray(
        generatedRetaPlayers.retaId,
        retas.map((r) => r.id),
      ),
    );

  const byReta = new Map<number, RecentSplit>();
  for (const r of retas) byReta.set(r.id, { teamAIds: [], teamBIds: [] });
  for (const row of rows) {
    const split = byReta.get(row.retaId);
    if (!split || row.playerId == null) continue; // guests excluded from variety
    (row.team === "A" ? split.teamAIds : split.teamBIds).push(row.playerId);
  }
  return retas.map((r) => byReta.get(r.id)!);
}

export type GeneratedRetaPlayerRow = {
  playerId: number | null;
  team: string;
  role: Position;
  overall: number;
  name: string;
  displayName: string;
  nationality: string;
  isGuest: boolean;
};
export type GeneratedRetaWithPlayers = GeneratedReta & {
  players: GeneratedRetaPlayerRow[];
};

/** Generated retas (newest first) with their player assignments attached. */
export async function getGeneratedRetas(
  limit = 200,
): Promise<GeneratedRetaWithPlayers[]> {
  const retas = await db
    .select()
    .from(generatedRetas)
    .orderBy(desc(generatedRetas.createdAt), desc(generatedRetas.id))
    .limit(limit);
  if (retas.length === 0) return [];

  const rows = await db
    .select({
      retaId: generatedRetaPlayers.retaId,
      playerId: generatedRetaPlayers.playerId,
      guestName: generatedRetaPlayers.guestName,
      team: generatedRetaPlayers.team,
      role: generatedRetaPlayers.role,
      overall: generatedRetaPlayers.overall,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(generatedRetaPlayers)
    .leftJoin(players, eq(generatedRetaPlayers.playerId, players.id))
    .where(
      inArray(
        generatedRetaPlayers.retaId,
        retas.map((r) => r.id),
      ),
    );

  const byReta = new Map<number, GeneratedRetaPlayerRow[]>();
  for (const row of rows) {
    const list = byReta.get(row.retaId) ?? [];
    const guest = row.playerId == null;
    list.push({
      playerId: row.playerId,
      team: row.team,
      role: row.role,
      overall: row.overall,
      name: row.name ?? row.guestName ?? "Invitado",
      displayName: row.displayName ?? row.guestName ?? row.name ?? "Invitado",
      nationality: row.nationality ?? "mx",
      isGuest: guest,
    });
    byReta.set(row.retaId, list);
  }

  return retas.map((r) => ({ ...r, players: byReta.get(r.id) ?? [] }));
}

// ── Reta words ─────────────────────────────────────────────────────────────
/** All contributed words, newest first (for the /palabras wall). */
export async function getRetaWords(): Promise<RetaWord[]> {
  return db.select().from(retaWords).orderBy(desc(retaWords.createdAt));
}

/** Words for the rotating banner: base list + contributions, de-duplicated. */
export async function getBannerWords(): Promise<string[]> {
  const rows = await db.select({ word: retaWords.word }).from(retaWords);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of [...rotatingWords, ...rows.map((r) => r.word)]) {
    const key = w.trim().toLowerCase();
    if (w.trim() && !seen.has(key)) {
      seen.add(key);
      out.push(w.trim());
    }
  }
  return out;
}
