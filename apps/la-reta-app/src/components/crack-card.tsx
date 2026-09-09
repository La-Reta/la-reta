import { View } from "react-native";

import {
  SpotlightCard,
  SpotlightCardSkeleton,
} from "@/components/spotlight-card";
import { Text } from "@/components/ui/text";
import { Spacing } from "@/constants/theme";
import { STAT_ABBR, STAT_KEYS, type Player } from "@/lib/types";

/** Alto de la fila de atributos, para que el esqueleto reserve su sitio. */
const STAT_ROW_HEIGHT = 42;

/**
 * El jugador de mayor overall, con su retrato y el hexágono de atributos
 * abierto en fila.
 *
 * Traslada la ficha FIFA de la web: la cara identifica antes que el nombre, el
 * OVR pesa a la derecha y los seis atributos van debajo en cifras tabulares
 * para que las columnas cuadren de una fila a otra.
 *
 * La forma la pone `SpotlightCard`, compartida con el goleador; aquí solo vive
 * lo que es propio del crack, que son los seis atributos.
 */
export function CrackCard({
  player,
  onPress,
}: {
  player: Player | null;
  onPress?: () => void;
}) {
  if (player === null) {
    return <SpotlightCardSkeleton footerHeight={STAT_ROW_HEIGHT} />;
  }

  return (
    <SpotlightCard
      footer={<StatRow player={player} />}
      onPress={onPress}
      player={player}
      statLabel="OVR"
      statValue={player.overall}
    />
  );
}

function StatRow({ player }: { player: Player }) {
  return (
    <View style={{ flexDirection: "row" }}>
      {STAT_KEYS.map((key) => (
        <View
          key={key}
          style={{ flex: 1, alignItems: "center", gap: Spacing.half }}
        >
          <Text variant="statSmall">{player[key]}</Text>
          <Text tone="faint" variant="eyebrow">
            {STAT_ABBR[key]}
          </Text>
        </View>
      ))}
    </View>
  );
}
