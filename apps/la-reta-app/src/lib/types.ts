/**
 * Forma mínima de lo que devuelve la API, solo con los campos que la app usa
 * hoy. Es una copia deliberada, no la fuente de verdad: el esquema vive en
 * apps/la-reta-web/lib/db/schema.ts.
 *
 * Cuando la app crezca, esto debería salir a un paquete compartido
 * (packages/api-contract) que ambos lados importen, para que un cambio de
 * columna rompa el build en vez de fallar en runtime.
 */

export type Position = "GK" | "DEF" | "MID" | "FWD" | string;

export interface Player {
  id: number;
  name: string;
  displayName: string;
  position: Position;
  position2: Position | null;
  nationality: string;
  photoUrl: string | null;
  age: number;
  overall: number;
}

export interface MatchTeam {
  key: string;
  name: string;
  score: number;
}

export interface Match {
  id: number;
  createdAt: string;
  teamAName: string | null;
  teamBName: string | null;
  scoreA: number | null;
  scoreB: number | null;
  teams: MatchTeam[] | null;
}
