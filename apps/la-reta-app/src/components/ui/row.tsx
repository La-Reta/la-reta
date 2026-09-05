import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";

export type RowProps = {
  title: string;
  detail?: string;
  meta?: string;
  icon?: IconName;
  onPress?: () => void;
  last?: boolean;
};

/**
 * Fila de una lista de ajustes.
 *
 * El icono va en un cuadrado con el verde rebajado detrás: sobre el papel a
 * pelo, un trazo de 1.8 se pierde y la fila vuelve a ser una lista de texto.
 */
export function Row({
  title,
  detail,
  meta,
  icon,
  onPress,
  last = false,
}: RowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={onPress === undefined}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
          paddingVertical: Spacing.three,
          borderBottomWidth: last ? 0 : 1,
          borderBottomColor: Palette.hairline,
        }}
      >
        {icon ? (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: Radius.sm,
              borderCurve: "continuous",
              backgroundColor: Palette.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon color={Palette.accent} name={icon} size={18} />
          </View>
        ) : null}

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text variant="bodyStrong">{title}</Text>
          {detail ? (
            <Text tone="muted" variant="caption">
              {detail}
            </Text>
          ) : null}
        </View>

        {meta ? (
          <Text tone="faint" variant="caption">
            {meta}
          </Text>
        ) : null}

        {onPress ? (
          <Icon color={Palette.inkFaint} name="chevron" size={16} />
        ) : null}
      </View>
    </Pressable>
  );
}
