import { View, type StyleProp, type ViewStyle } from "react-native";

import { Text } from "@/components/ui/text";
import { Display, Palette } from "@/constants/theme";

/**
 * La marca: la media cancha vista desde arriba — el rectángulo, la línea de
 * medio campo y el círculo central. Se dibuja con vistas, sin SVG ni PNG, para
 * que escale a cualquier tamaño y para que la capa de bienvenida pueda animar
 * cada pieza por separado.
 *
 * La geometría vive aquí y no en el componente para que la versión animada del
 * splash use exactamente los mismos números en vez de una copia que se
 * desincroniza al primer retoque.
 */
export function markGeometry(size: number) {
  const stroke = Math.max(1.5, size * 0.03);
  const height = size * 0.72;

  return {
    stroke,
    width: size,
    height,
    radius: size * 0.13,
    circle: height * 0.46,
  };
}

export type BrandMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function BrandMark({ size = 72, style }: BrandMarkProps) {
  const g = markGeometry(size);

  return (
    <View
      style={[
        {
          width: g.width,
          height: g.height,
          borderRadius: g.radius,
          borderCurve: "continuous",
          borderWidth: g.stroke,
          borderColor: Palette.ink,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: g.stroke,
          backgroundColor: Palette.ink,
        }}
      />
      <View
        style={{
          width: g.circle,
          height: g.circle,
          borderRadius: g.circle / 2,
          borderWidth: g.stroke,
          borderColor: Palette.accent,
          backgroundColor: Palette.paper,
        }}
      />
    </View>
  );
}

export type WordmarkProps = {
  size?: number;
  tone?: "ink" | "onAccent";
};

export function Wordmark({ size = 20, tone = "ink" }: WordmarkProps) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: Display.bold,
        fontSize: size,
        lineHeight: size * 1.3,
        letterSpacing: size * 0.12,
        textTransform: "uppercase",
      }}
      tone={tone}
    >
      La Reta
    </Text>
  );
}
