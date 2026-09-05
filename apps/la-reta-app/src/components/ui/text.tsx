import { Text as RNText, type TextProps as RNTextProps } from "react-native";

import { Tones, Type, type Tone } from "@/constants/theme";

export type TextVariant = keyof typeof Type;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: Tone;
};

/**
 * Único punto de entrada para texto. Obliga a elegir un peldaño de la escala
 * en vez de inventar un `fontSize` por pantalla, que es como una tipografía
 * deja de ser un sistema.
 */
export function Text({
  variant = "body",
  tone = "ink",
  style,
  ...rest
}: TextProps) {
  return (
    <RNText style={[Type[variant], { color: Tones[tone] }, style]} {...rest} />
  );
}
