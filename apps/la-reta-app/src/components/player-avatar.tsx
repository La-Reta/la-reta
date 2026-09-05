import { Image } from "expo-image";
import { View } from "react-native";

import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";
import { initials, photoSource } from "@/lib/photos";
import { cardTier, TIER_STYLES } from "@/lib/ratings";
import type { Player } from "@/lib/types";

/**
 * Retrato redondo del jugador para filas y listas.
 *
 * Ocho de los diecinueve del roster no tienen foto, así que el caso sin imagen
 * no es una excepción: las iniciales van sobre el color de su nivel de carta,
 * para que una fila sin foto siga diciendo algo del jugador en vez de dejar un
 * hueco gris.
 */
export function PlayerAvatar({
  player,
  size = 44,
}: {
  player: Player;
  size?: number;
}) {
  const source = photoSource(player.photoUrl);
  const tier = TIER_STYLES[cardTier(player.overall)];

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        backgroundColor: tier.gradient[1],
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: Palette.hairline,
      }}
    >
      {source ? (
        <Image
          accessibilityIgnoresInvertColors
          alt={player.displayName}
          contentFit="cover"
          contentPosition="top center"
          source={source}
          style={{ width: "100%", height: "100%" }}
          transition={180}
        />
      ) : (
        <Text
          style={{
            color: tier.ink,
            fontSize: size * 0.34,
            fontWeight: "800",
            letterSpacing: 0.4,
          }}
        >
          {initials(player.displayName)}
        </Text>
      )}
    </View>
  );
}
