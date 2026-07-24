/**
 * Reglas de la votación post-partido (Figura / Golazo / Error). Puras y sin
 * dependencias para poder testearse: `npx tsx lib/match-votes.ts`.
 */

export const VOTING_DAYS = 7;

export type VoteCategory = "gol" | "error" | "figura";

/** Orden y textos de las categorías (la figura primero). */
export const VOTE_CATEGORIES: {
  key: VoteCategory;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    key: "gol",
    label: "Golazo",
    short: "Golazo",
    description: "El mejor gol o la mejor jugada.",
  },
  {
    key: "error",
    label: "Error del partido",
    short: "Error",
    description: "El blooper, el pastel de la reta.",
  },
  {
    key: "figura",
    label: "Figura del partido",
    short: "Figura",
    description: "El MVP: el mejor dentro de la cancha.",
  },
];

export const VOTE_CATEGORY_KEYS = VOTE_CATEGORIES.map((c) => c.key);

/** Cuándo cierra la votación: creación del partido + VOTING_DAYS. */
export function votingClosesAt(createdAt: Date | string | number): Date {
  return new Date(new Date(createdAt).getTime() + VOTING_DAYS * 86_400_000);
}

/** ¿Sigue abierta la votación? (`now` inyectable para tests). */
export function isVotingOpen(
  createdAt: Date | string | number,
  now: number = Date.now(),
): boolean {
  return now < votingClosesAt(createdAt).getTime();
}

/** Clave estable de un candidato: `p:<id>` (roster) o `g:<nombre>` (invitado). */
export function candidateKey(c: {
  playerId: number | null;
  guestName?: string | null;
}): string {
  return c.playerId != null ? `p:${c.playerId}` : `g:${c.guestName ?? ""}`;
}

// ── self-check ───────────────────────────────────────────────────────────────
export function demo() {
  const assert = (c: boolean, m: string) => {
    if (!c) throw new Error("match-votes demo failed: " + m);
  };
  const created = new Date("2026-01-01T00:00:00Z");
  const day = 86_400_000;
  assert(
    isVotingOpen(created, created.getTime() + 6 * day),
    "abierta al día 6",
  );
  assert(
    !isVotingOpen(created, created.getTime() + 8 * day),
    "cerrada al día 8",
  );
  assert(
    votingClosesAt(created).getTime() === created.getTime() + 7 * day,
    "cierra a 7 días",
  );
  assert(candidateKey({ playerId: 5 }) === "p:5", "clave roster");
  assert(
    candidateKey({ playerId: null, guestName: "Beto" }) === "g:Beto",
    "clave invitado",
  );
  return "ok";
}

// typeof/optional guards: este módulo también se importa en el cliente.
if (
  typeof process !== "undefined" &&
  process.argv?.[1]?.endsWith("match-votes.ts")
)
  console.log(demo());
