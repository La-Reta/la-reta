import { View, type ViewProps } from "react-native";

import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

export type SurfaceProps = ViewProps & {
  /**
   * `card` flota sobre el papel; `sunken` es un hueco dentro de otra tarjeta.
   * `bare` solo aporta el filete, para listas donde una sombra por fila sería
   * ruido.
   */
  variant?: "card" | "sunken" | "bare";
  padded?: boolean;
};

/**
 * Contenedor de contenido. La jerarquía la marcan el filete y un poco de
 * elevación; nunca un borde grueso ni una sombra dura.
 */
export function Surface({
  variant = "card",
  padded = true,
  style,
  ...rest
}: SurfaceProps) {
  return (
    <View
      style={[
        {
          borderRadius: Radius.lg,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor: Palette.hairline,
          padding: padded ? Spacing.three : 0,
        },
        variant === "card" && {
          backgroundColor: Palette.surface,
          boxShadow: Shadow.card,
        },
        variant === "sunken" && { backgroundColor: Palette.surfaceSunken },
        style,
      ]}
      {...rest}
    />
  );
}
