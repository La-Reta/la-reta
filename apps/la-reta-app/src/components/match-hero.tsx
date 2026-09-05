import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { Display, Palette, Spacing } from "@/constants/theme";
import { formatMatchDate } from "@/lib/dates";
import { balanceLabel, matchTeams, teamColor } from "@/lib/teams";
import type { Match } from "@/lib/types";

/**
 * El resultado, en el lenguaje del resto de la app: papel, filetes y cifras
 * grandes en Oswald.
 *
 * Hubo una versión anterior con tarjeta oscura, degradado y una barra de
 * colores por equipo. Se veía como cualquier plantilla: la app había pasado de
 * un acento a ocho colores y perdido lo que la distinguía. Aquí el color de
 * equipo se queda en un filete de 3 pt —identifica sin decorar— y el peso lo
 * lleva la tipografía, igual que en la tira de cifras de Inicio.
 *
 * Quien ganó se marca con tinta plena; los demás quedan en gris. No hace falta
 * un adorno para decir quién fue primero.
 */
export function MatchHero({ match }: { match: Match }) {
  const teams = matchTeams(match);
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const total = ranked.reduce((sum, team) => sum + team.score, 0);

  return (
    <View style={{ gap: Spacing.three }}>
      <Text tone="muted" variant="eyebrow">
        {formatMatchDate(match.playedAt)} · {balanceLabel(match.balance)}
      </Text>

      <View style={{ borderTopWidth: 1, borderTopColor: Palette.hairline }}>
        {ranked.map((team, index) => {
          const winner = index === 0;

          return (
            <View
              key={team.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.three,
                paddingVertical: Spacing.three,
                borderBottomWidth: 1,
                borderBottomColor: Palette.hairline,
              }}
            >
              <View
                style={{
                  width: 3,
                  height: 30,
                  borderRadius: 2,
                  backgroundColor: teamColor(team.key),
                }}
              />

              <Text
                numberOfLines={1}
                style={{ flex: 1 }}
                tone={winner ? "ink" : "muted"}
                variant="bodyStrong"
              >
                {team.name}
              </Text>

              <Text
                style={{
                  color: winner ? Palette.ink : Palette.inkFaint,
                  fontFamily: Display.bold,
                  fontSize: 40,
                  lineHeight: 48,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {team.score}
              </Text>
            </View>
          );
        })}
      </View>

      <Text tone="faint" variant="caption">
        {total} {total === 1 ? "gol" : "goles"} · {ranked.length} equipos ·
        balance {match.balance}/100
      </Text>
    </View>
  );
}
