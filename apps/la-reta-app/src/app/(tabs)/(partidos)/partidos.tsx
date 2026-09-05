import { useRouter } from "expo-router";
import { FlatList, RefreshControl, View } from "react-native";

import { MatchCard } from "@/components/match-card";
import { Notice } from "@/components/notice";
import { Text } from "@/components/ui/text";
import {
  BottomTabInset,
  MaxContentWidth,
  Palette,
  Spacing,
} from "@/constants/theme";
import { useReta } from "@/hooks/use-reta";

/**
 * Historial de partidos, del más reciente al más viejo — el orden en que ya
 * llegan de la API.
 *
 * El primero va destacado en verde: es el que la gente abre la app para ver, y
 * entre cinco tarjetas blancas iguales no se distinguía del de hace meses.
 */
export default function PartidosScreen() {
  const router = useRouter();
  const { matches, players, loading, error, refetch } = useReta();

  return (
    <FlatList
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.three,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
      data={matches ?? []}
      keyExtractor={(match) => String(match.id)}
      ListEmptyComponent={
        loading ? null : (
          <View style={{ paddingVertical: Spacing.six, alignItems: "center" }}>
            <Text tone="faint" variant="caption">
              Todavía no hay partidos registrados.
            </Text>
          </View>
        )
      }
      ListHeaderComponent={
        error === null ? null : (
          <Notice
            actionLabel="Reintentar"
            detail={error}
            onAction={refetch}
            title="No pudimos leer los partidos"
          />
        )
      }
      refreshControl={
        <RefreshControl
          onRefresh={refetch}
          refreshing={loading}
          tintColor={Palette.accent}
        />
      }
      renderItem={({ item, index }) => (
        <MatchCard
          // La API ordena del más reciente al más viejo, así que el primero es
          // el último jugado.
          featured={index === 0}
          match={item}
          onPress={() =>
            router.push({
              pathname: "/partido/[id]",
              params: { id: String(item.id) },
            })
          }
          players={players}
          showDate
        />
      )}
    />
  );
}
