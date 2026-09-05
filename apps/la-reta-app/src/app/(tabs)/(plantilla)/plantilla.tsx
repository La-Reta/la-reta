import { useRouter } from "expo-router";
import { useDeferredValue, useMemo, useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import { FifaCard } from "@/components/fifa-card";
import { RosterControls } from "@/components/roster-controls";
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
import { GROUP_SHORT, playerGroups, type PositionGroup } from "@/lib/players";
import { searchPlayers, sortPlayers } from "@/lib/roster";
import { useRosterSort } from "@/lib/roster-sort";
import type { Player } from "@/lib/types";

type Filter = PositionGroup | "all";

const GROUPS: PositionGroup[] = ["GK", "DEF", "MID", "FWD"];

/**
 * El roster como galería de cartas.
 *
 * En lista, diecinueve filas de nombre y número se leen igual que una hoja de
 * cálculo. En cartas se reconoce a la gente por la cara y el color del nivel
 * antes de leer nada, que es exactamente lo que hace la web.
 *
 * El filtro mira las dos posiciones. La base guarda una secundaria y la ficha
 * ya la enseña ("RWB / GK"), pero aquí solo contaba la principal: quien buscara
 * un portero de emergencia en POR no encontraba al lateral que también ataja.
 *
 * Encima van el buscador y el orden. Con diecinueve fichas la rejilla aún se
 * recorre con el pulgar, pero la plantilla solo crece, y buscar por nombre es
 * lo primero que la gente intenta en cualquier lista larga porque es lo que
 * hace en todas las demás apps que tiene abiertas.
 */
export default function PlantillaScreen() {
  const router = useRouter();
  const { players, loading, error, refetch } = useReta();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  // El orden vive fuera del componente porque quien lo cambia es la hoja, que
  // es otra ruta y no puede devolver un valor al volver.
  const sort = useRosterSort();

  // La lista se filtra con el texto **diferido** y no con el que se está
  // escribiendo. Los datos ya están en el teléfono, así que no hay petición que
  // espaciar; lo que se evita es que recalcular y repintar diecinueve cartas
  // bloquee la siguiente tecla. Un `setTimeout` fijo añadiría espera aunque
  // sobre tiempo — esto solo se retrasa cuando de verdad va justo.
  const search = useDeferredValue(query);

  const options = useMemo(() => {
    const counts = new Map<PositionGroup, number>();
    for (const player of players ?? []) {
      // Por línea cubierta y no por posición principal: un GK/CB suma en
      // portería y en defensa. Por eso las cifras de las pestañas suman más
      // que "Todos", y está bien — cuentan puestos, no personas.
      for (const group of playerGroups(player)) {
        counts.set(group, (counts.get(group) ?? 0) + 1);
      }
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
    const byLine =
      filter === "all"
        ? (players ?? [])
        : (players ?? []).filter((player) =>
            playerGroups(player).includes(filter)
          );

    const list = sortPlayers(searchPlayers(byLine, search), sort);

    // Con un número impar de cartas, la última se quedaba sola en su fila y el
    // `flex: 1` le daba el ancho entero: salía al doble que las demás. Un hueco
    // invisible al final le devuelve su mitad.
    return list.length % 2 === 1 ? [...list, null] : list;
  }, [players, filter, search, sort]);

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
              {query.trim().length > 0
                ? `Nadie coincide con “${query.trim()}”.`
                : "No hay jugadores en esta línea."}
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
          <RosterControls onQuery={setQuery} query={query} sort={sort} />
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
