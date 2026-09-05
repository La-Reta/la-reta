import { View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import type { Player, VoteCategory, VoteTally } from "@/lib/types";

/**
 * Lo que votó la banda después del partido: figura, golazo y blooper.
 *
 * Cada categoría enseña al más votado con su proporción sobre el total, porque
 * "3 votos" no dice si ganó por poco o por unanimidad.
 *
 * Sin tarjetas de colores. La versión anterior teñía cada fila de ámbar, verde
 * y rojo, y tres bloques pastel apilados son exactamente lo que hace que una
 * pantalla parezca una plantilla. La categoría se distingue por su icono y su
 * antetítulo, que es suficiente cuando solo hay tres.
 */

const CATEGORIES: { key: VoteCategory; label: string; icon: IconName }[] = [
  { key: "figura", label: "Figura", icon: "star" },
  { key: "gol", label: "Golazo", icon: "ball" },
  { key: "error", label: "Blooper", icon: "flame" },
];

export function VoteResults({
  tally,
  players,
}: {
  tally: VoteTally[] | null;
  /** Roster para poner cara al más votado; los invitados van con iniciales. */
  players?: Player[] | null;
}) {
  const results = CATEGORIES.map((category) => {
    const rows = (tally ?? []).filter((row) => row.category === category.key);
    if (rows.length === 0) return null;

    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const winner = rows.reduce((best, row) =>
      row.count > best.count ? row : best
    );
    const player = players?.find((item) => item.id === winner.playerId) ?? null;

    return {
      ...category,
      total,
      count: winner.count,
      // El recuento trae el nombre del registro ("Paulo César Herrejón
      // Chávez") y no cabe en una fila; si está en el roster gana su nombre de
      // carta, que es como se le dice de verdad.
      name: player?.displayName ?? winner.name,
      player,
    };
  }).filter((entry) => entry !== null);

  if (results.length === 0) return null;

  return (
    <View>
      {results.map((entry, index) => (
        <View
          key={entry.key}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.three,
            paddingVertical: Spacing.three,
            borderBottomWidth: index === results.length - 1 ? 0 : 1,
            borderBottomColor: Palette.hairline,
          }}
        >
          {entry.player ? (
            <PlayerAvatar player={entry.player} size={38} />
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
                {entry.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={{ flex: 1, gap: Spacing.half }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.one,
              }}
            >
              <Icon
                color={Palette.inkFaint}
                name={entry.icon}
                size={11}
                strokeWidth={2}
              />
              <Text tone="faint" variant="eyebrow">
                {entry.label}
              </Text>
            </View>
            <Text numberOfLines={1} variant="bodyStrong">
              {entry.name}
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text tone="accent" variant="statSmall">
              {entry.count}
            </Text>
            <Text tone="faint" variant="eyebrow">
              de {entry.total}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
