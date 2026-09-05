import { View, type ViewProps } from "react-native";

import { Text } from "@/components/ui/text";
import { Spacing } from "@/constants/theme";

export type SectionProps = ViewProps & {
  title: string;
  /** Apunte a la derecha del antetítulo: un total, una fecha, un estado. */
  meta?: string;
};

/** Bloque con antetítulo. Un solo patrón de encabezado en toda la app. */
export function Section({
  title,
  meta,
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
        {meta ? (
          <Text tone="faint" variant="eyebrow">
            {meta}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}
