import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  Pressable,
  View,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { GlassSurface } from "@/components/ui/glass-surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = "primary" | "glass" | "ghost" | "plain";
export type ButtonSize = "lg" | "md";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  /** Reparte el ancho cuando varios botones comparten una fila. */
  flex?: number;
  style?: ViewStyle;
};

/**
 * Botón de acción. `glass` usa el material de iOS 26; `primary` es el relleno
 * sólido que Apple reserva para la acción principal de la pantalla; `ghost`
 * dibuja solo el perímetro, para una acción secundaria que aun así tiene que
 * verse pulsable; `plain` es texto suelto.
 *
 * El cristal nunca se usa para la acción principal a propósito: es traslúcido
 * por definición y su contraste depende de lo que tenga detrás, así que la
 * acción que queremos que se elija va en sólido y la alternativa en cristal.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  disabled = false,
  loading = false,
  flex,
  style,
}: ButtonProps) {
  const pressed = useSharedValue(0);
  const inert = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressed.value * 0.035 }],
    opacity: 1 - pressed.value * 0.12,
  }));

  function onPressIn() {
    pressed.value = withSpring(1, { damping: 20, stiffness: 400 });
  }

  function onPressOut() {
    pressed.value = withSpring(0, { damping: 20, stiffness: 300 });
  }

  function handlePress() {
    // El toque físico solo existe en iOS; en Android sería una vibración
    // genérica que no acompaña, y en web no hay nada que llamar.
    if (process.env.EXPO_OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }

  const height = size === "lg" ? 54 : 44;
  // Con `flex`, el ancho ya lo reparte la fila y el relleno solo le quita sitio
  // a la etiqueta: en la tarjeta de perfil, "Iniciar sesión" se cortaba a
  // "Iniciar se...". Sin flex el relleno sí define el ancho y se mantiene.
  const roomy = size === "lg" ? Spacing.four : Spacing.three;
  const paddingHorizontal = flex === undefined ? roomy : Spacing.two;

  const content = (
    <View style={{ opacity: loading ? 0 : 1 }}>
      <Text
        numberOfLines={1}
        style={{ letterSpacing: -0.2 }}
        tone={toneFor(variant, inert)}
        variant={size === "lg" ? "bodyStrong" : "caption"}
      >
        {label}
      </Text>
    </View>
  );

  const inner = (
    <View
      style={{
        height,
        paddingHorizontal,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {content}
      {loading ? (
        <View style={{ position: "absolute" }}>
          <ActivityIndicator
            color={variant === "primary" ? Palette.accentInk : Palette.ink}
          />
        </View>
      ) : null}
    </View>
  );

  const shape: ViewStyle = {
    borderRadius: Radius.pill,
    overflow: "hidden",
    opacity: inert ? 0.45 : 1,
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      disabled={inert}
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[{ flex }, animatedStyle, style]}
    >
      {variant === "glass" ? (
        <GlassSurface glassEffectStyle="regular" isInteractive style={shape}>
          {inner}
        </GlassSurface>
      ) : null}

      {variant === "primary" ? (
        <View
          style={[
            shape,
            { backgroundColor: Palette.accent, boxShadow: Shadow.accent },
          ]}
        >
          {inner}
        </View>
      ) : null}

      {variant === "ghost" ? (
        <View
          style={[
            shape,
            {
              borderWidth: 1,
              borderColor: Palette.line,
              backgroundColor: Palette.surface,
            },
          ]}
        >
          {inner}
        </View>
      ) : null}

      {variant === "plain" ? <View style={shape}>{inner}</View> : null}
    </AnimatedPressable>
  );
}

function toneFor(variant: ButtonVariant, inert: boolean) {
  if (inert) return "faint" as const;
  if (variant === "primary") return "onAccent" as const;
  if (variant === "plain") return "muted" as const;
  return "ink" as const;
}
