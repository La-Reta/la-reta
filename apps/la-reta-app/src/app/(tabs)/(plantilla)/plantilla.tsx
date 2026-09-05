import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { FifaCard } from "@/components/fifa-card";
import { Notice } from "@/components/notice";
import { Icon } from "@/components/ui/icon";
import { Segmented } from "@/components/ui/segmented";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";
import { GROUP_SHORT, positionGroup, type PositionGroup } from "@/lib/players";
import type { Player } from "@/lib/types";

type Filter = PositionGroup | "all";

const GROUPS: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/**
 * El roster como galería de cartas.
 *
 * En lista, diecinueve filas de nombre y número se leen igual que una hoja de
 * cálculo. En cartas se reconoce a la gente por la cara y el color del nivel
 * antes de leer nada, que es exactamente lo que hace la web.
 */
export default function PlantillaScreen() {
  const router = useRouter();
  const { players, loading, error, refetch } = useReta();
  const [filter, setFilter] = useState<Filter>("all");

  const options = useMemo(() => {
    const counts = new Map<PositionGroup, number>();
    for (const player of players ?? []) {
      const group = positionGroup(player.position);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }

    return [
      { value: "all" as const, label: "Todos", count: players?.length ?? 0 },
      ...GROUPS.filter((group) => (counts.get(group) ?? 0) > 0).map(
        (group) => ({
          value: group,
          label: GROUP_SHORT[group],
          count: counts.get(group) ?? 0,
        })
      ),
    ];
  }, [players]);

  const visible = useMemo(() => {
    const list =
      filter === "all"
        ? (players ?? [])
        : (players ?? []).filter(
            (player) => positionGroup(player.position) === filter
          );

    // Con un número impar de cartas, la última se quedaba sola en su fila y el
    // `flex: 1` le daba el ancho entero: salía al doble que las demás. Un hueco
    // invisible al final le devuelve su mitad.
    return list.length % 2 === 1 ? [...list, null] : list;
  }, [players, filter]);

  // Forma con `pathname` + `params`: las rutas tipadas validan el patrón, y
  // una plantilla de cadena con el id numérico no encaja en ese tipo.
  const open = (player: Player) =>
    router.push({
      pathname: "/jugador/[id]",
      params: { id: String(player.id) },
    });

  return (
    <FlatList
      columnWrapperStyle={{ gap: Spacing.three }}
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
      data={visible}
      keyExtractor={(player, index) =>
        player?.id.toString() ?? `hueco-${index}`
      }
      ListEmptyComponent={
        loading ? null : (
          <View
            style={{
              paddingVertical: Spacing.six,
              alignItems: "center",
              gap: Spacing.three,
            }}
          >
            <Icon color={Palette.inkFaint} name="ball" size={32} />
            <Text tone="faint" variant="caption">
              No hay jugadores en esta línea.
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        <View style={{ gap: Spacing.three, paddingTop: Spacing.two }}>
          {error === null ? null : (
            <Notice
              actionLabel="Reintentar"
              detail={error}
              onAction={refetch}
              title="No pudimos leer la plantilla"
            />
          )}
          <Segmented onChange={setFilter} options={options} value={filter} />
        </View>
      }
      numColumns={2}
      refreshControl={
        <RefreshControl
          onRefresh={refetch}
          refreshing={loading}
          tintColor={Palette.accent}
        />
      }
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          {item === null ? null : (
            <FifaCard onPress={() => open(item)} player={item} />
          )}
        </View>
      )}
    />
  );
}
