import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useApi } from "@/hooks/use-api";
import type { Player } from "@/lib/types";

/**
 * Primera vista contra la API real: GET /api/v1/players.
 *
 * Es la prueba de que el contrato funciona desde un cliente nativo — misma
 * ruta, mismo JSON y mismos códigos de estado que consume la web.
 */
export default function PlayersScreen() {
  const { data, error, loading, refetch } = useApi<Player[]>("/api/v1/players");

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ThemedText style={styles.title} type="title">
          Jugadores
        </ThemedText>

        {error !== null && (
          <ThemedView style={styles.notice} type="backgroundElement">
            <ThemedText type="smallBold">No se pudo cargar</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {error}
            </ThemedText>
          </ThemedView>
        )}

        {loading && data === null ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={data ?? []}
            keyExtractor={(player) => String(player.id)}
            ListEmptyComponent={
              error === null ? (
                <ThemedText
                  style={styles.empty}
                  themeColor="textSecondary"
                  type="small"
                >
                  Sin jugadores todavía.
                </ThemedText>
              ) : null
            }
            refreshControl={
              <RefreshControl onRefresh={refetch} refreshing={loading} />
            }
            renderItem={({ item }) => <PlayerRow player={item} />}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const positions = [player.position, player.position2]
    .filter(Boolean)
    .join(" / ");

  return (
    <ThemedView style={styles.row} type="backgroundElement">
      <View style={styles.rowMain}>
        <ThemedText type="smallBold">{player.displayName}</ThemedText>
        <ThemedText themeColor="textSecondary" type="small">
          {positions} · {player.age} años
        </ThemedText>
      </View>
      <ThemedText type="title">{player.overall}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  title: {
    paddingVertical: Spacing.three,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    gap: Spacing.two,
    // La tab bar flota sobre el contenido: sin este hueco el último elemento
    // queda debajo del glass.
    paddingBottom: BottomTabInset + Spacing.four,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowMain: {
    flex: 1,
    gap: Spacing.one,
  },
  notice: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  empty: {
    paddingVertical: Spacing.five,
    textAlign: "center",
  },
});
