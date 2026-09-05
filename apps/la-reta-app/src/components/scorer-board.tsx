import { View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { matchTeams, teamColor } from "@/lib/teams";
import type { Match, Player, Scorer } from "@/lib/types";

/**
 * Quién marcó, agrupado por equipo.
 *
 * Es la parte de la ficha que más se mira: el marcador dice cómo quedó, esto
 * dice quién lo hizo. Va en filas con filete y la cara a la izquierda —el mismo
 * patrón que el ranking de Inicio y la plantilla— en vez de en fichas
 * encajonadas: en una lista, encajonar cada elemento no añade información y
 * multiplica los bordes.
 */
export function ScorerBoard({
  match,
  players,
}: {
  match: Match;
  players: Player[] | null;
}) {
  const blocks = matchTeams(match)
    .map((team) => ({
      team,
      scorers: match.scorers
        .filter((scorer) => scorer.team === team.key && scorer.goals > 0)
        .sort((a, b) => b.goals - a.goals),
    }))
    .filter((block) => block.scorers.length > 0);

  if (blocks.length === 0) {
    return (
      <Text tone="faint" variant="caption">
        Nadie registró goles en este partido.
      </Text>
    );
  }

  return (
    <View style={{ gap: Spacing.four }}>
      {blocks.map((block) => (
        <View key={block.team.key} style={{ gap: Spacing.one }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.two,
              paddingBottom: Spacing.one,
            }}
          >
            <View
              style={{
                width: 3,
                height: 12,
                borderRadius: 2,
                backgroundColor: teamColor(block.team.key),
              }}
            />
            <Text style={{ flex: 1 }} tone="muted" variant="eyebrow">
              {block.team.name}
            </Text>
            <Text tone="faint" variant="eyebrow">
              {block.team.score} {block.team.score === 1 ? "gol" : "goles"}
            </Text>
          </View>

          {block.scorers.map((scorer, index) => (
            <ScorerRow
              key={`${scorer.playerId ?? "g"}-${scorer.displayName}`}
              last={index === block.scorers.length - 1}
              player={
                players?.find((item) => item.id === scorer.playerId) ?? null
              }
              scorer={scorer}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function ScorerRow({
  scorer,
  player,
  last,
}: {
  scorer: Scorer;
  player: Player | null;
  last: boolean;
}) {
  const detail = [
    scorer.assists > 0
      ? `${scorer.assists} ${scorer.assists === 1 ? "asistencia" : "asistencias"}`
      : null,
    scorer.isGuest ? "Invitado" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
        paddingVertical: Spacing.two,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: Palette.hairline,
      }}
    >
      {player ? (
        <PlayerAvatar player={player} size={38} />
      ) : (
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: Palette.surfaceSunken,
            borderWidth: 1,
            borderColor: Palette.line,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text tone="faint" variant="caption">
            {scorer.displayName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, gap: Spacing.half }}>
        <Text numberOfLines={1} variant="bodyStrong">
          {scorer.displayName}
        </Text>
        {detail ? (
          <Text numberOfLines={1} tone="faint" variant="caption">
            {detail}
          </Text>
        ) : null}
      </View>

      <Text tone="accent" variant="statSmall">
        ×{scorer.goals}
      </Text>
    </View>
  );
}
