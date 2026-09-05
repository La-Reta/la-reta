import { View } from "react-native";

import { Figure } from "@/components/ui/figure";
import type { IconName } from "@/components/ui/icon";
import { Palette, Spacing } from "@/constants/theme";
import type { RetaSummary } from "@/lib/summary";

export type StatField = "squad" | "level" | "matches" | "goals";

const ALL_FIELDS: StatField[] = ["squad", "level", "matches", "goals"];

/**
 * La cabecera de cifras.
 *
 * Va sobre el papel con dos filetes horizontales y separadores verticales,
 * como el sumario de una portada. Sin tarjeta a propósito: son datos de
 * contexto, no un objeto que se pueda tocar.
 *
 * `fields` existe para que la portada sin sesión enseñe solo los agregados que
 * sirven de prueba —cuánta gente, cuántos partidos, cuántos goles— y no repita
 * el mismo cuadro de mando que ya hay dentro.
 */
export function StatStrip({
  summary,
  pending,
  fields = ALL_FIELDS,
}: {
  summary: RetaSummary;
  pending: boolean;
  fields?: StatField[];
}) {
  // Con cuatro columnas cada celda mide poco más de 70 pt y "Jugadores" parte
  // en dos líneas, lo que descuadra la altura de toda la tira.
  const tight = fields.length > 3;

  const byField: Record<
    StatField,
    { label: string; value: number; icon: IconName }
  > = {
    squad: {
      label: tight ? "Plantilla" : "Jugadores",
      value: summary.squad,
      icon: "people",
    },
    level: { label: "Nivel", value: summary.avgOverall, icon: "star" },
    matches: {
      label: "Partidos",
      value: summary.matchesPlayed,
      icon: "trophy",
    },
    goals: { label: "Goles", value: summary.goals, icon: "ball" },
  };
  const cells = fields.map((field) => byField[field]);

  return (
    <View
      style={{
        flexDirection: "row",
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Palette.hairline,
        paddingVertical: Spacing.three,
      }}
    >
      {cells.map((cell, index) => (
        <View
          key={cell.label}
          style={{
            flex: 1,
            paddingLeft: index === 0 ? 0 : Spacing.three,
            borderLeftWidth: index === 0 ? 0 : 1,
            borderLeftColor: Palette.hairline,
          }}
        >
          <Figure
            icon={cell.icon}
            label={cell.label}
            value={pending ? null : cell.value}
          />
        </View>
      ))}
    </View>
  );
}
