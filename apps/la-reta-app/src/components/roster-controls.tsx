import { useRouter } from "expo-router";
import { Pressable, TextInput, View } from "react-native";

import { Icon } from "@/components/ui/icon";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";
import { DEFAULT_SORT, type SortKey } from "@/lib/roster";

/**
 * Buscador y orden de la plantilla.
 *
 * Sin botón de buscar: se escribe y la lista responde, que es lo que hacen
 * todas las apps que esta gente ya usa. El aspa para vaciar aparece solo cuando
 * hay algo escrito.
 *
 * El orden va detrás de un botón y no de otra fila de pastillas: son seis
 * criterios y ya hay una fila de filtros por línea encima. Abre una hoja
 * nativa —una ruta con `formSheet`, la misma presentación que el calendario—
 * donde caben con su nombre completo y el pulgar llega.
 */
export function RosterControls({
  query,
  onQuery,
  sort,
}: {
  query: string;
  onQuery: (value: string) => void;
  sort: SortKey;
}) {
  const router = useRouter();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.two,
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.two,
          height: 44,
          paddingHorizontal: Spacing.three,
          borderRadius: Radius.pill,
          borderCurve: "continuous",
          backgroundColor: Palette.surfaceSunken,
        }}
      >
        <Icon color={Palette.inkFaint} name="search" size={17} />

        <TextInput
          accessibilityLabel="Buscar jugador"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
          onChangeText={onQuery}
          placeholder="Buscar por nombre o posición"
          placeholderTextColor={Palette.inkFaint}
          returnKeyType="search"
          selectionColor={Palette.accent}
          style={{ ...Type.body, flex: 1, color: Palette.ink }}
          value={query}
        />

        {query.length > 0 ? (
          <Pressable
            accessibilityLabel="Vaciar la búsqueda"
            accessibilityRole="button"
            hitSlop={Spacing.three}
            onPress={() => onQuery("")}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Icon color={Palette.inkFaint} name="close" size={16} />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel="Ordenar la plantilla"
        accessibilityRole="button"
        onPress={() => router.push("/orden")}
        style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
      >
        {/* Mismo gris que el campo de búsqueda y no cristal: son un solo
            control partido en dos, y con materiales distintos el botón se leía
            como una pieza suelta al lado del buscador. El cristal se queda para
            lo que flota sobre el contenido —la barra de abajo—, no para lo que
            vive dentro de la pantalla. */}
        <View
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radius.pill,
            backgroundColor: Palette.surfaceSunken,
          }}
        >
          <Icon
            // Verde cuando el orden no es el de siempre: es lo único que
            // avisa de que la lista no está como se dejó.
            color={sort === DEFAULT_SORT ? Palette.inkMuted : Palette.accent}
            name="sliders"
            size={19}
          />
        </View>
      </Pressable>
    </View>
  );
}
