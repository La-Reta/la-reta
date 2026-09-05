import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { MaxContentWidth, Palette, Spacing } from "@/constants/theme";
import { SORTS } from "@/lib/roster";
import { setRosterSort, useRosterSort } from "@/lib/roster-sort";

/**
 * Cómo ordenar la plantilla.
 *
 * Es una ruta y no un `Modal` propio porque así la presenta iOS: una hoja de
 * verdad, con su arrastre elástico, su tirador y el cierre por gesto. La
 * versión hecha a mano se abría con una animación plana que se notaba pegada al
 * lado del calendario, que ya usaba esto.
 *
 * La altura la fija el contenido (`fitToContents` en el layout), así que la
 * hoja mide lo que miden las seis filas y ni un punto más.
 *
 * Las filas van en una vista normal y no en un `ScrollView`: con
 * `fitToContents`, la hoja medía el scroll y no su contenido, y la última fila
 * acababa dibujada fuera del área táctil —se veía "Nombre · A a Z" pero el
 * toque no llegaba—. Seis filas caben sin desplazar; si algún día no cupieran,
 * el arreglo es un detent con altura, no volver a meter un scroll aquí.
 */
export default function OrdenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sort = useRosterSort();

  return (
    <View
      style={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        paddingHorizontal: Spacing.four,
        // Deja sitio al tirador de la hoja, que se dibuja encima.
        paddingTop: Spacing.five,
        // Sin esto la última fila queda bajo el indicador de inicio.
        paddingBottom: insets.bottom + Spacing.three,
      }}
    >
      <Text
        style={{ paddingBottom: Spacing.two }}
        tone="muted"
        variant="eyebrow"
      >
        Ordenar por
      </Text>

      {SORTS.map((option, index) => {
        const active = option.key === sort;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.key}
            onPress={() => {
              setRosterSort(option.key);
              router.back();
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.three,
                paddingVertical: Spacing.three,
                borderBottomWidth: index === SORTS.length - 1 ? 0 : 1,
                borderBottomColor: Palette.hairline,
              }}
            >
              <Icon
                color={active ? Palette.accent : Palette.inkMuted}
                name={option.icon}
                size={19}
              />

              <Text
                style={{ flex: 1 }}
                tone={active ? "accent" : "ink"}
                variant="body"
              >
                {option.label}
              </Text>

              {active ? (
                <Icon
                  color={Palette.accent}
                  name="check"
                  size={18}
                  strokeWidth={2.2}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
