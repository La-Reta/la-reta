import AsyncStorage from "@react-native-async-storage/async-storage";
import { defaultTeamName, isTeamKey, type TeamKey } from "@repo/reta/teams";

/**
 * Cómo se llaman los equipos de esta reta.
 *
 * Los nombres son de la cuadrilla, no del reparto: el equipo A es "Jochis FC"
 * esta semana y la que viene, así que viven en el teléfono y no en cada reta
 * generada. Se guardan por letra, que es lo único estable entre repartos.
 *
 * Todo cabe en una clave: son seis cadenas cortas como mucho. Un registro por
 * equipo serían seis lecturas de disco para pintar una pantalla, y esto se lee
 * al abrir la convocatoria.
 */

const KEY = "reta.team-names.v1";

/** Un nombre más largo no cabe en la cancha ni en el mensaje del grupo. */
export const MAX_TEAM_NAME = 24;

export type TeamNames = Partial<Record<TeamKey, string>>;

export async function loadTeamNames(): Promise<TeamNames> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return {};

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const names: TeamNames = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (isTeamKey(key) && typeof value === "string") {
        names[key] = value;
      }
    }
    return names;
  } catch {
    // Un JSON corrupto o un disco lleno no valen una pantalla rota: se cae a
    // los nombres por defecto, que es exactamente lo que había antes.
    return {};
  }
}

export async function saveTeamNames(names: TeamNames): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(names));
  } catch {
    // Se pierde el nombre nuevo; la reta se juega igual.
  }
}

/**
 * Normaliza lo que escribió el usuario.
 *
 * Devolver `undefined` cuando queda vacío o cuando coincide con el nombre por
 * defecto es lo que evita que el almacén crezca con "Equipo A": si no aporta
 * nada, no se guarda.
 */
export function cleanTeamName(key: TeamKey, value: string): string | undefined {
  const name = value.trim().slice(0, MAX_TEAM_NAME);
  if (name.length === 0 || name === defaultTeamName(key)) return undefined;
  return name;
}

/** El nombre efectivo: el que puso el usuario, o "Equipo A". */
export function teamNameOf(names: TeamNames, key: TeamKey): string {
  return names[key] ?? defaultTeamName(key);
}
