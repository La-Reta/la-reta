import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing, Type } from "@/constants/theme";

export type FieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  error?: string | null;
};

/**
 * Campo de formulario. La etiqueta va fuera y siempre visible: un placeholder
 * que hace de etiqueta desaparece justo cuando el usuario empieza a escribir,
 * que es cuando más falta hace.
 */
export function Field({ label, error, onBlur, onFocus, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = pickBorder(focused, error);

  return (
    <View style={{ gap: Spacing.two }}>
      <Text tone="muted" variant="eyebrow">
        {label}
      </Text>

      <TextInput
        accessibilityLabel={label}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        placeholderTextColor={Palette.inkFaint}
        selectionColor={Palette.accent}
        style={{
          ...Type.body,
          color: Palette.ink,
          height: 52,
          paddingHorizontal: Spacing.three,
          borderRadius: Radius.md,
          borderCurve: "continuous",
          borderWidth: 1,
          borderColor,
          backgroundColor: Palette.surface,
        }}
        {...rest}
      />

      {error ? (
        <Text tone="danger" variant="caption">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function pickBorder(focused: boolean, error?: string | null): string {
  if (error) return Palette.danger;
  if (focused) return Palette.accent;
  return Palette.line;
}
