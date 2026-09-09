import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

import { PlayerAvatar } from "@/components/player-avatar";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Spacing } from "@/constants/theme";
import { formatPositions } from "@/lib/players";
import type { Player } from "@/lib/types";

/**
 * La tarjeta de portada que corona a alguien: retrato, nombre y **una** cifra
 * grande a la derecha.
 *
 * Es el `Spotlight` de la web traído tal cual, y por el mismo motivo: el crack
 * y el goleador contestan preguntas distintas —quién juega mejor y quién la
 * mete— pero se leen de un vistazo con la misma forma, así que compararlos no
 * cuesta nada. Cuando eran dos componentes sueltos, cualquier retoque en uno
 * dejaba al otro un poco distinto y el par empezaba a parecer casual.
 *
 * Lo que cambia entre las dos vive abajo, en `footer`: los seis atributos del
 * crack, o los partidos y los puntos del carrusel del goleador.
 */
export function SpotlightCard({
  player,
  statValue,
  statLabel,
  footer,
  onPress,
}: {
  player: Player;
  statValue: number;
  /** Tres o cuatro letras bajo la cifra: OVR, GOLES. */
  statLabel: string;
  /** Zona bajo el filete. Sin ella la tarjeta termina en la fila del retrato. */
  footer?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: Spacing.three,
          }}
        >
          <PlayerAvatar player={player} size={54} />

          <View style={{ flex: 1, gap: Spacing.one }}>
            <Text numberOfLines={1} selectable variant="title">
              {player.displayName}
            </Text>
            <Text tone="muted" variant="caption">
              {formatPositions(player)} · {player.age} años
            </Text>
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text selectable tone="accent" variant="stat">
              {statValue}
            </Text>
            <Text tone="faint" variant="eyebrow">
              {statLabel}
            </Text>
          </View>

          {onPress ? (
            <Icon color={Palette.inkFaint} name="chevron" size={16} />
          ) : null}
        </View>

        {footer === undefined ? null : (
          <>
            <View style={{ height: 1, backgroundColor: Palette.hairline }} />
            {footer}
          </>
        )}
      </Surface>
    </Pressable>
  );
}

/**
 * El hueco de una `SpotlightCard` que todavía no tiene datos.
 *
 * `footerHeight` reserva el alto del pie real —los seis atributos del crack
 * miden más que la línea de partidos del goleador—, para que al llegar el dato
 * la tarjeta no cambie de tamaño y empuje lo que tiene debajo.
 */
export function SpotlightCardSkeleton({
  footerHeight,
}: {
  footerHeight?: number;
}) {
  return (
    <Surface style={{ gap: Spacing.three, padding: Spacing.four }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <Skeleton height={54} width={54} />
        <View style={{ flex: 1, gap: Spacing.two }}>
          <Skeleton height={22} width="62%" />
          <Skeleton height={13} width="40%" />
        </View>
        <Skeleton height={34} width={54} />
      </View>

      {footerHeight === undefined ? null : (
        <>
          <View style={{ height: 1, backgroundColor: Palette.hairline }} />
          <Skeleton height={footerHeight} width="100%" />
        </>
      )}
    </Surface>
  );
}
