import { Pressable, View } from "react-native";

import { Icon, type IconName } from "@/components/ui/icon";
import { Palette, Radius, Shadow, Spacing } from "@/constants/theme";

/** Diámetro del disco. Con 32 el icono se ve y la barra no se descuadra. */
const DISC_SIZE = 32;

export type HeaderActionProps = {
  /** Qué hace, en una palabra. No se dibuja: es lo que anuncia VoiceOver. */
  label: string;
  icon: IconName;
  onPress: () => void;
  /** Frase completa para VoiceOver cuando el icono solo no basta. */
  hint?: string;
  disabled?: boolean;
  /**
   * `solid` es la acción de la pantalla; `plain` acompaña sin competir. Dos
   * discos verdes juntos se pelean y ninguno de los dos manda.
   */
  variant?: "solid" | "plain";
};

/**
 * La acción de una pantalla, en su cabecera.
 *
 * Va sin etiqueta, así que el icono tiene que decirlo todo: `person-plus` para
 * sumar gente, `shuffle` para repartir. Si hiciera falta una palabra para
 * entenderlo, esa acción no cabe aquí y pide otro sitio.
 *
 * **El disco es verde macizo.** En la barra, un trazo fino del color del texto
 * de sistema se lee como decoración y se pierde junto al título; el disco es lo
 * único que hay en ese borde y se ve antes de leer nada. Es la excepción a
 * reservar el verde macizo para el banner de la próxima reta: aquí no adorna,
 * marca lo que se puede hacer.
 *
 * Apagado no se pinta en verde translúcido sino en gris hundido: un verde
 * lavado se lee como un verde feo, y uno gris se lee como apagado.
 */
export function HeaderAction({
  label,
  icon,
  onPress,
  hint,
  disabled = false,
  variant = "solid",
}: HeaderActionProps) {
  const solid = variant === "solid";

  return (
    <Pressable
      accessibilityHint={hint}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      // El disco mide 32 y el mínimo táctil son 44: el resto lo pone este
      // margen invisible, no una caja mayor que descuadraría la barra.
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.94 : 1 }],
      })}
    >
      <View
        style={[
          {
            width: DISC_SIZE,
            height: DISC_SIZE,
            borderRadius: Radius.pill,
            alignItems: "center",
            justifyContent: "center",
          },
          solid &&
            (disabled
              ? { backgroundColor: Palette.surfaceSunken }
              : {
                  backgroundColor: Palette.accent,
                  boxShadow: Shadow.accent,
                }),
        ]}
      >
        <Icon
          color={
            disabled
              ? Palette.inkFaint
              : solid
                ? Palette.accentInk
                : Palette.accent
          }
          name={icon}
          size={19}
          // Sobre verde y a 19 pt, el trazo de 1.8 se deshilacha.
          strokeWidth={2}
        />
      </View>
    </Pressable>
  );
}

/**
 * Dos acciones en la misma cabecera.
 *
 * La principal va a la derecha del todo, que es el borde al que llega el pulgar
 * y donde iOS pone siempre la que manda.
 */
export function HeaderActions({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.three,
      }}
    >
      {children}
    </View>
  );
}
