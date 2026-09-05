import { Pressable, View, type ViewProps } from "react-native";

import { Text } from "@/components/ui/text";
import { Spacing } from "@/constants/theme";

export type SectionProps = ViewProps & {
  title: string;
  /** Apunte a la derecha del antetítulo: un total, una fecha, un estado. */
  meta?: string;
  /**
   * Convierte el apunte en un atajo pulsable ("Todos", "Ver más"). Se dibuja en
   * verde para que se lea como acción y no como dato, que es lo único que
   * distingue un total de un botón cuando los dos son versalitas.
   */
  onMetaPress?: () => void;
};

/** Bloque con antetítulo. Un solo patrón de encabezado en toda la app. */
export function Section({
  title,
  meta,
  onMetaPress,
  children,
  style,
  ...rest
}: SectionProps) {
  return (
    <View style={[{ gap: Spacing.three }, style]} {...rest}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: Spacing.two,
        }}
      >
        <Text tone="muted" variant="eyebrow">
          {title}
        </Text>
        {meta === undefined ? null : onMetaPress ? (
          <Pressable
            accessibilityRole="button"
            onPress={onMetaPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
          >
            <Text tone="accent" variant="eyebrow">
              {meta}
            </Text>
          </Pressable>
        ) : (
          <Text tone="faint" variant="eyebrow">
            {meta}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}
