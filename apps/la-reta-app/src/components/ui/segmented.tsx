import { Pressable, ScrollView, View } from "react-native";

import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  /** Recuento a la derecha de la etiqueta; se omite si no aplica. */
  count?: number;
};

export type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Filtro de una sola elección, en fila y con scroll horizontal.
 *
 * Va en cápsulas y no en un `SegmentedControl` nativo porque las opciones
 * crecen (cuatro líneas más "todos") y el control nativo reparte el ancho a
 * partes iguales: con cinco, las etiquetas se cortan.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <ScrollView
      contentContainerStyle={{ gap: Spacing.two, paddingRight: Spacing.four }}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {options.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.one,
                paddingVertical: Spacing.two,
                paddingHorizontal: Spacing.three,
                borderRadius: Radius.pill,
                borderWidth: 1,
                borderColor: active ? Palette.accent : Palette.line,
                backgroundColor: active ? Palette.accent : Palette.surface,
              }}
            >
              <Text
                style={{ color: active ? Palette.accentInk : Palette.inkMuted }}
                variant="caption"
              >
                {option.label}
              </Text>
              {option.count === undefined ? null : (
                <Text
                  style={{
                    color: active ? Palette.accentInk : Palette.inkFaint,
                    opacity: active ? 0.8 : 1,
                  }}
                  variant="caption"
                >
                  {option.count}
                </Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
