import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";
import { formatMatchDate } from "@/lib/dates";
import { matchTeams } from "@/lib/teams";
import type { Match, Player, Scorer } from "@/lib/types";

/**
 * Marcador de un partido: los dos equipos a los lados y el resultado en medio,
 * como un rótulo de televisión.
 *
 * `featured` viste el más reciente en verde macizo. En una lista de cinco
 * tarjetas blancas idénticas, el último partido —el que la gente viene a ver—
 * no se distinguía de uno de hace tres meses.
 *
 * Los goleadores van en fichas con cara y no en una lista de nombres separados
 * por puntos: en un partido de ocho goles esa línea se leía como un párrafo, y
 * la cara reconoce a la gente antes que el texto.
 */
export function MatchCard({
  match,
  players,
  showDate = false,
  featured = false,
  onPress,
}: {
  match: Match;
  /** Roster para resolver la foto de cada goleador; sin él van solo los nombres. */
  players?: Player[] | null;
  showDate?: boolean;
  featured?: boolean;
  onPress?: () => void;
}) {
  const scorers = match.scorers.filter((scorer) => scorer.goals > 0);
  const teams = matchTeams(match);
  const extra = teams.length > 2 ? teams.slice(2) : [];
  const [home, away] = teams;

  const ink = featured ? "onAccent" : "ink";
  const soft = featured ? "onAccent" : "muted";
  const line = featured ? "rgba(255, 255, 255, 0.24)" : Palette.hairline;

  const body = (
    <Surface
      style={{
        gap: Spacing.three,
        padding: Spacing.four,
        ...(featured
          ? {
              backgroundColor: Palette.accent,
              borderColor: Palette.accent,
              boxShadow: Shadow.accent,
            }
          : null),
      }}
    >
      {showDate || featured ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: Spacing.two,
          }}
        >
          <Text
            style={featured ? { opacity: 0.85 } : undefined}
            tone={featured ? "onAccent" : "faint"}
            variant="eyebrow"
          >
            {formatMatchDate(match.playedAt)}
          </Text>

          {featured ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.one,
                paddingHorizontal: Spacing.two,
                paddingVertical: 3,
                borderRadius: Radius.pill,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <Icon
                color={Palette.accentInk}
                name="flame"
                size={12}
                strokeWidth={2}
              />
              <Text tone="onAccent" variant="eyebrow">
                Último
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1 }}
          tone={ink}
          variant="bodyStrong"
        >
          {home.name}
        </Text>
        <Text selectable tone={ink} variant="stat">
          {home.score}–{away.score}
        </Text>
        <Text
          numberOfLines={1}
          style={{ flex: 1, textAlign: "right" }}
          tone={ink}
          variant="bodyStrong"
        >
          {away.name}
        </Text>
      </View>

      {extra.length === 0 ? null : (
        <Text
          style={featured ? { opacity: 0.85 } : undefined}
          tone={soft}
          variant="caption"
        >
          {/* Una reta de 3+ equipos guarda su marcador completo; sin esta línea
              el tercero desaparecería del listado. */}
          {extra.map((team) => `${team.name} ${team.score}`).join(" · ")}
        </Text>
      )}

      <View style={{ height: 1, backgroundColor: line }} />

      {scorers.length === 0 ? (
        <Text
          style={featured ? { opacity: 0.8 } : undefined}
          tone={featured ? "onAccent" : "faint"}
          variant="caption"
        >
          Sin goleadores registrados.
        </Text>
      ) : (
        <View
          style={{ flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }}
        >
          {scorers.map((scorer) => (
            <ScorerChip
              featured={featured}
              key={`${scorer.playerId ?? "guest"}-${scorer.displayName}`}
              player={
                players?.find((item) => item.id === scorer.playerId) ?? null
              }
              scorer={scorer}
            />
          ))}
        </View>
      )}
    </Surface>
  );

  if (onPress === undefined) return body;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {body}
    </Pressable>
  );
}

function ScorerChip({
  scorer,
  player,
  featured,
}: {
  scorer: Scorer;
  player: Player | null;
  featured: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
        paddingRight: Spacing.three,
        paddingLeft: player ? Spacing.half : Spacing.three,
        paddingVertical: Spacing.half,
        borderRadius: Radius.pill,
        backgroundColor: featured
          ? "rgba(255, 255, 255, 0.18)"
          : Palette.surfaceSunken,
      }}
    >
      {player ? <PlayerAvatar player={player} size={24} /> : null}
      <Text
        numberOfLines={1}
        tone={featured ? "onAccent" : "ink"}
        variant="caption"
      >
        {scorer.displayName}
        {scorer.goals > 1 ? ` ×${scorer.goals}` : ""}
      </Text>
    </View>
  );
}
