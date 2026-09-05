import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { View, type ViewProps } from "react-native";

import { Palette, Shadow } from "@/constants/theme";

/**
 * El material de Apple donde existe, y algo honesto donde no.
 *
 * `isLiquidGlassAvailable()` es falso en Android, en web y en iOS anteriores a
 * 26, y ahí `GlassView` es un `View` pelado: sin este relevo el botón saldría
 * transparente e ilegible. La alternativa no imita el cristal —una copia con
 * opacidades siempre se ve peor que el material real—, sino que asume una
 * tarjeta blanca con filete, que es lo que el resto de la interfaz ya usa.
 */
export const hasLiquidGlass = isLiquidGlassAvailable();

export type GlassSurfaceProps = ViewProps & {
  /** `clear` deja pasar más fondo; `regular` es el material por defecto. */
  glassEffectStyle?: "clear" | "regular";
  isInteractive?: boolean;
  tintColor?: string;
};

export function GlassSurface({
  glassEffectStyle = "regular",
  isInteractive = false,
  tintColor,
  style,
  ...rest
}: GlassSurfaceProps) {
  if (hasLiquidGlass) {
    return (
      <GlassView
        // La app tiene un solo tema; sin fijarlo, el cristal seguiría al
        // sistema y en modo oscuro dibujaría texto claro sobre papel claro.
        colorScheme="light"
        glassEffectStyle={glassEffectStyle}
        isInteractive={isInteractive}
        style={style}
        tintColor={tintColor}
        {...rest}
      />
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: tintColor ?? Palette.surface,
          borderWidth: 1,
          borderColor: Palette.hairline,
          boxShadow: Shadow.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}
