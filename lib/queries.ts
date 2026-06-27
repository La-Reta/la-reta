import "server-only";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { asc, desc, eq, sql } from "drizzle-orm";
import {
  db,
  players,
  playerStatHistory,
  ideas,
  matches,
  matchGoals,
  retaWords,
  playerComments,
  type Player,
  type StatHistory,
  type Idea,
  type Match,
  type RetaWord,
  type PlayerComment,
} from "@/lib/db";
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
  const rows = await db.select().from(players).where(eq(players.id, id)).limit(1);
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
    .where(eq(playerComments.playerId, playerId))
    .orderBy(asc(playerComments.createdAt));
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

// ── Ideas ────────────────────────────────────────────────────────────────
/** All ideas, newest first. */
export async function getIdeas(): Promise<Idea[]> {
  return db.select().from(ideas).orderBy(desc(ideas.createdAt));
}

// ── Matches ──────────────────────────────────────────────────────────────
export type Scorer = {
  playerId: number;
  name: string;
  displayName: string;
  nationality: string;
  goals: number;
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
      goals: matchGoals.goals,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(matchGoals)
    .innerJoin(players, eq(matchGoals.playerId, players.id));

  const byMatch = new Map<number, Scorer[]>();
  for (const g of goalRows) {
    const list = byMatch.get(g.matchId) ?? [];
    list.push({
      playerId: g.playerId,
      name: g.name,
      displayName: g.displayName,
      nationality: g.nationality,
      goals: g.goals,
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
  const [m] = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  if (!m) return null;

  const goalRows = await db
    .select({
      playerId: matchGoals.playerId,
      goals: matchGoals.goals,
      name: players.name,
      displayName: players.displayName,
      nationality: players.nationality,
    })
    .from(matchGoals)
    .innerJoin(players, eq(matchGoals.playerId, players.id))
    .where(eq(matchGoals.matchId, id));

  return {
    ...m,
    scorers: goalRows.sort((a, b) => b.goals - a.goals),
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
      matches: sql<number>`count(distinct ${matchGoals.matchId})`.mapWith(Number),
    })
    .from(matchGoals)
    .innerJoin(players, eq(matchGoals.playerId, players.id))
    .groupBy(players.id, players.name, players.displayName, players.nationality)
    .having(sql`sum(${matchGoals.goals}) > 0`)
    .orderBy(desc(totalGoals));
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
