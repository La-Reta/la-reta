import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  players,
  playerStatHistory,
  ideas,
  matches,
  matchGoals,
  type NewPlayer,
  type NewStatHistory,
} from "./schema";
import { computeOverall } from "../ratings";
import { STAT_KEYS, type Position, type Foot } from "../constants";

type Seed = Omit<NewPlayer, "overall" | "id" | "createdAt" | "updatedAt"> & {
  position: Position;
  preferredFoot: Foot;
};

const roster: Seed[] = [
  {
    name: "Erling Haaland", displayName: "HAALAND", position: "ST", preferredFoot: "left",
    nationality: "no", age: 24, heightCm: 195, weightKg: 88,
    pace: 96, shooting: 96, passing: 80, dribbling: 88, defending: 60, physical: 94,
  },
  {
    name: "Kylian Mbappé", displayName: "MBAPPÉ", position: "LW", preferredFoot: "right",
    nationality: "fr", age: 26, heightCm: 178, weightKg: 75,
    pace: 97, shooting: 90, passing: 80, dribbling: 92, defending: 36, physical: 78,
  },
  {
    name: "Kevin De Bruyne", displayName: "DE BRUYNE", position: "CM", preferredFoot: "right",
    nationality: "be", age: 33, heightCm: 181, weightKg: 70,
    pace: 72, shooting: 88, passing: 94, dribbling: 87, defending: 64, physical: 78,
  },
  {
    name: "Rodri", displayName: "RODRI", position: "CDM", preferredFoot: "right",
    nationality: "es", age: 28, heightCm: 191, weightKg: 82,
    pace: 64, shooting: 78, passing: 86, dribbling: 82, defending: 86, physical: 85,
  },
  {
    name: "Virgil van Dijk", displayName: "VAN DIJK", position: "CB", preferredFoot: "right",
    nationality: "nl", age: 33, heightCm: 195, weightKg: 92,
    pace: 78, shooting: 60, passing: 71, dribbling: 72, defending: 90, physical: 86,
  },
  {
    name: "Achraf Hakimi", displayName: "HAKIMI", position: "RB", position2: "RW", preferredFoot: "right",
    nationality: "ma", age: 26, heightCm: 181, weightKg: 73,
    pace: 93, shooting: 73, passing: 79, dribbling: 84, defending: 78, physical: 78,
  },
  {
    name: "Theo Hernández", displayName: "THEO", position: "LB", preferredFoot: "left",
    nationality: "fr", age: 27, heightCm: 184, weightKg: 81,
    pace: 92, shooting: 75, passing: 78, dribbling: 84, defending: 79, physical: 83,
  },
  {
    name: "Jude Bellingham", displayName: "BELLINGHAM", position: "CAM", position2: "CM", preferredFoot: "right",
    nationality: "gb", age: 21, heightCm: 186, weightKg: 75,
    pace: 81, shooting: 84, passing: 83, dribbling: 87, defending: 78, physical: 84,
  },
  {
    name: "Lautaro Martínez", displayName: "LAUTARO", position: "ST", preferredFoot: "right",
    nationality: "ar", age: 27, heightCm: 174, weightKg: 72,
    pace: 84, shooting: 89, passing: 78, dribbling: 86, defending: 47, physical: 83,
  },
  {
    name: "Alisson Becker", displayName: "ALISSON", position: "GK", preferredFoot: "right",
    nationality: "br", age: 32, heightCm: 191, weightKg: 91,
    pace: 56, shooting: 24, passing: 70, dribbling: 65, defending: 89, physical: 88,
  },
  // --- Jugadores de la reta ---
  {
    name: "Luis Pastor", displayName: "PASTOR", position: "CAM", preferredFoot: "left",
    nationality: "mx", age: 28, heightCm: 175, weightKg: 72,
    pace: 78, shooting: 74, passing: 82, dribbling: 84, defending: 55, physical: 70,
  },
  {
    name: "Juan Hernández", displayName: "JUANJUAN", position: "ST", preferredFoot: "right",
    nationality: "mx", age: 30, heightCm: 180, weightKg: 78,
    pace: 80, shooting: 83, passing: 70, dribbling: 79, defending: 45, physical: 78,
  },
  {
    name: "Carlos Ramírez", displayName: "CHARLY", position: "CB", position2: "CDM", preferredFoot: "right",
    nationality: "mx", age: 33, heightCm: 188, weightKg: 86,
    pace: 64, shooting: 50, passing: 64, dribbling: 60, defending: 82, physical: 84,
  },
  {
    name: "Diego Torres", displayName: "DIEGO", position: "CM", preferredFoot: "right",
    nationality: "mx", age: 26, heightCm: 178, weightKg: 74,
    pace: 74, shooting: 68, passing: 80, dribbling: 78, defending: 70, physical: 73,
  },
  {
    name: "Miguel Ángel Soto", displayName: "MIGUE", position: "LW", preferredFoot: "left",
    nationality: "mx", age: 24, heightCm: 172, weightKg: 68,
    pace: 88, shooting: 72, passing: 73, dribbling: 85, defending: 40, physical: 64,
  },
  {
    name: "Roberto Gómez", displayName: "BETO", position: "GK", position2: "CB", preferredFoot: "right",
    nationality: "mx", age: 35, heightCm: 185, weightKg: 88,
    pace: 50, shooting: 22, passing: 60, dribbling: 55, defending: 80, physical: 82,
  },
  {
    name: "Andrés Flores", displayName: "ANDY", position: "RB", position2: "RM", preferredFoot: "right",
    nationality: "mx", age: 27, heightCm: 176, weightKg: 71,
    pace: 84, shooting: 60, passing: 70, dribbling: 74, defending: 72, physical: 70,
  },
  {
    name: "Fernando Cruz", displayName: "FER", position: "CDM", preferredFoot: "right",
    nationality: "mx", age: 31, heightCm: 182, weightKg: 80,
    pace: 62, shooting: 64, passing: 76, dribbling: 70, defending: 79, physical: 80,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL no está definida (.env.local).");

  const db = drizzle(neon(url));

  const rows: NewPlayer[] = roster.map((p) => ({
    ...p,
    overall: computeOverall(p.position, {
      pace: p.pace ?? 50,
      shooting: p.shooting ?? 50,
      passing: p.passing ?? 50,
      dribbling: p.dribbling ?? 50,
      defending: p.defending ?? 50,
      physical: p.physical ?? 50,
    }),
  }));

  console.log(`Limpiando tabla players...`);
  await db.delete(players); // cascade borra también player_stat_history

  console.log(`Insertando ${rows.length} jugadores...`);
  const inserted = await db.insert(players).values(rows).returning();

  // Snapshots de historial. Todos tienen al menos uno (su "alta"); a un par
  // les generamos una progresión retroactiva para demostrar la gráfica.
  const now = Date.now();
  const DEMO = new Set(["PASTOR", "HAALAND"]);
  const statsOf = (p: (typeof inserted)[number]) =>
    Object.fromEntries(STAT_KEYS.map((k) => [k, p[k]])) as Record<
      (typeof STAT_KEYS)[number],
      number
    >;
  const applyDelta = (s: Record<string, number>, d: number) =>
    Object.fromEntries(
      STAT_KEYS.map((k) => [k, Math.max(1, Math.min(99, s[k] + d))]),
    ) as Record<(typeof STAT_KEYS)[number], number>;
  const snap = (
    p: (typeof inserted)[number],
    stats: Record<(typeof STAT_KEYS)[number], number>,
    daysAgo: number,
  ): NewStatHistory => ({
    playerId: p.id,
    ...stats,
    overall: computeOverall(p.position, stats),
    recordedAt: new Date(now - daysAgo * 86_400_000),
  });

  const history: NewStatHistory[] = [];
  for (const p of inserted) {
    const cur = statsOf(p);
    if (DEMO.has(p.displayName)) {
      history.push(
        snap(p, applyDelta(cur, -7), 120),
        snap(p, applyDelta(cur, -3), 50),
        snap(p, cur, 0),
      );
    } else {
      history.push(snap(p, cur, 90));
    }
  }
  console.log(`Insertando ${history.length} snapshots de historial...`);
  await db.insert(playerStatHistory).values(history);

  // Ideas demo
  console.log("Insertando ideas demo...");
  await db.insert(ideas).values([
    {
      title: "Llevar conos y petos a la reta",
      description:
        "Para marcar bien las porterías y diferenciar equipos. Podemos hacer una vaca para comprarlos.",
      author: "Charly",
      category: "cancha",
      status: "planeada",
      priority: "media",
      estimate: "1 jornada",
    },
    {
      title: "Tabla de goleadores en la app",
      description:
        "Llevar el registro de quién mete más goles cada temporada para picarnos sanamente.",
      author: "Juanjuan",
      category: "mejora",
      status: "hecha",
      priority: "alta",
      estimate: "Listo",
    },
    {
      title: "Reta nocturna los viernes",
      description: "Una cascarita extra entre semana, con luces, para los que no llegan al fin de semana.",
      author: "Migue",
      category: "social",
      status: "nueva",
    },
    {
      title: "Rotar al portero cada partido",
      description: "Para que nadie se quede siempre en el arco y todos jueguen de campo.",
      category: "reglas",
      status: "en_progreso",
      priority: "baja",
    },
  ]);

  // Partidos demo
  console.log("Insertando partidos demo...");
  const id = (name: string) =>
    inserted.find((p) => p.displayName === name)?.id ?? inserted[0].id;
  const dateAgo = (days: number) =>
    new Date(now - days * 86_400_000).toISOString().slice(0, 10);

  const [m1] = await db
    .insert(matches)
    .values({
      playedAt: dateAgo(14),
      teamAName: "Claros",
      teamBName: "Oscuros",
      scoreA: 5,
      scoreB: 3,
      notes: "Partidazo de inicio de temporada.",
    })
    .returning({ id: matches.id });
  const [m2] = await db
    .insert(matches)
    .values({
      playedAt: dateAgo(7),
      teamAName: "Claros",
      teamBName: "Oscuros",
      scoreA: 4,
      scoreB: 4,
      notes: "Se acabó en empate, definimos por penales.",
    })
    .returning({ id: matches.id });

  await db.insert(matchGoals).values([
    { matchId: m1.id, playerId: id("HAALAND"), goals: 2 },
    { matchId: m1.id, playerId: id("PASTOR"), goals: 1 },
    { matchId: m1.id, playerId: id("MIGUE"), goals: 1 },
    { matchId: m1.id, playerId: id("JUANJUAN"), goals: 1 },
    { matchId: m1.id, playerId: id("LAUTARO"), goals: 2 },
    { matchId: m1.id, playerId: id("DIEGO"), goals: 1 },
    { matchId: m2.id, playerId: id("MBAPPÉ"), goals: 2 },
    { matchId: m2.id, playerId: id("HAALAND"), goals: 1 },
    { matchId: m2.id, playerId: id("FER"), goals: 1 },
    { matchId: m2.id, playerId: id("BELLINGHAM"), goals: 2 },
    { matchId: m2.id, playerId: id("ANDY"), goals: 1 },
    { matchId: m2.id, playerId: id("DIEGO"), goals: 1 },
  ]);

  console.log("✅ Seed completado.");
}

main().catch((err) => {
  console.error("❌ Seed falló:", err);
  process.exit(1);
});
