import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  integer,
  smallint,
  timestamp,
  text,
  date,
} from "drizzle-orm/pg-core";
import {
  POSITIONS,
  FEET,
  IDEA_CATEGORIES,
  IDEA_STATUSES,
  IDEA_PRIORITIES,
} from "@/lib/constants";

/**
 * Specific on-pitch position, FIFA style (GK, CB, CM, ST, ...).
 * The broader group (GK/DEF/MID/FWD) is derived in code from this value.
 */
export const positionEnum = pgEnum("position", POSITIONS);
export const footEnum = pgEnum("foot", FEET);

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  // Short name shown big on the card, e.g. "HAALAND"
  displayName: varchar("display_name", { length: 60 }).notNull(),
  position: positionEnum("position").notNull(),
  // Optional secondary position (e.g. a GK who can also play CB). Null when the
  // player only has one position.
  position2: positionEnum("position2"),
  preferredFoot: footEnum("preferred_foot").notNull().default("right"),

  // ISO 3166-1 alpha-2 country code, used to render the flag (e.g. "no", "mx")
  nationality: varchar("nationality", { length: 2 }).notNull().default("mx"),
  photoUrl: varchar("photo_url", { length: 500 }),

  // Physical profile
  age: smallint("age").notNull(),
  heightCm: smallint("height_cm").notNull(),
  weightKg: smallint("weight_kg").notNull(),

  // FIFA-style attributes (1-99)
  pace: smallint("pace").notNull().default(50),
  shooting: smallint("shooting").notNull().default(50),
  passing: smallint("passing").notNull().default(50),
  dribbling: smallint("dribbling").notNull().default(50),
  defending: smallint("defending").notNull().default(50),
  physical: smallint("physical").notNull().default(50),

  // Stored overall (position-weighted), recomputed on every write
  overall: smallint("overall").notNull().default(50),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

/**
 * Append-only snapshots of a player's attributes over time. A new row is written
 * whenever a player is created or their stats change, so we can chart progress.
 */
export const playerStatHistory = pgTable("player_stat_history", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  pace: smallint("pace").notNull(),
  shooting: smallint("shooting").notNull(),
  passing: smallint("passing").notNull(),
  dribbling: smallint("dribbling").notNull(),
  defending: smallint("defending").notNull(),
  physical: smallint("physical").notNull(),
  overall: smallint("overall").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export type StatHistory = typeof playerStatHistory.$inferSelect;
export type NewStatHistory = typeof playerStatHistory.$inferInsert;

// ── Ideas ──────────────────────────────────────────────────────────────────
export const ideaCategoryEnum = pgEnum("idea_category", IDEA_CATEGORIES);
export const ideaStatusEnum = pgEnum("idea_status", IDEA_STATUSES);
export const ideaPriorityEnum = pgEnum("idea_priority", IDEA_PRIORITIES);

export const ideas = pgTable("ideas", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 140 }).notNull(),
  description: text("description").notNull(),
  // Who proposed it (free text, optional — they may stay anonymous).
  author: varchar("author", { length: 60 }),
  category: ideaCategoryEnum("category").notNull().default("otro"),
  // Triage fields, set by admins.
  status: ideaStatusEnum("status").notNull().default("nueva"),
  priority: ideaPriorityEnum("priority"),
  estimate: varchar("estimate", { length: 60 }),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;

// ── Matches ────────────────────────────────────────────────────────────────
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  playedAt: date("played_at").notNull(),
  teamAName: varchar("team_a_name", { length: 60 })
    .notNull()
    .default("Equipo A"),
  teamBName: varchar("team_b_name", { length: 60 })
    .notNull()
    .default("Equipo B"),
  scoreA: smallint("score_a").notNull().default(0),
  scoreB: smallint("score_b").notNull().default(0),
  // How even the match felt, 0 (paliza) … 100 (parejísimo).
  balance: smallint("balance").notNull().default(50),
  // Duration in seconds (set by the live scoreboard; null for manual entries).
  durationSec: integer("duration_sec"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

/**
 * Goals scored by a player in a match. A row with goals = 0 also works as an
 * attendance record (the player was there but didn't score).
 */
export const matchGoals = pgTable("match_goals", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id")
    .notNull()
    .references(() => matches.id, { onDelete: "cascade" }),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  goals: smallint("goals").notNull().default(0),
});

export type MatchGoal = typeof matchGoals.$inferSelect;
export type NewMatchGoal = typeof matchGoals.$inferInsert;

// ── Reta words (community banner) ───────────────────────────────────────────
/** Words people contribute to fill "La Reta ____", with light client context. */
export const retaWords = pgTable("reta_words", {
  id: serial("id").primaryKey(),
  word: varchar("word", { length: 40 }).notNull(),
  author: varchar("author", { length: 60 }),
  language: varchar("language", { length: 24 }),
  timezone: varchar("timezone", { length: 64 }),
  screen: varchar("screen", { length: 24 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type RetaWord = typeof retaWords.$inferSelect;
export type NewRetaWord = typeof retaWords.$inferInsert;

// ── Player comments ─────────────────────────────────────────────────────────
/** Open comments on a player, with light client context. */
export const playerComments = pgTable("player_comments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  author: varchar("author", { length: 60 }),
  body: varchar("body", { length: 500 }).notNull(),
  // Optional 1-5 star rating; the player's average is derived from these.
  rating: smallint("rating"),
  language: varchar("language", { length: 24 }),
  timezone: varchar("timezone", { length: 64 }),
  screen: varchar("screen", { length: 24 }),
  platform: varchar("platform", { length: 80 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type PlayerComment = typeof playerComments.$inferSelect;
export type NewPlayerComment = typeof playerComments.$inferInsert;
