import { Stack } from "expo-router";

import { Palette } from "@/constants/theme";

/**
 * Alta y acceso viven en su propio grupo: el layout raíz lo presenta como
 * modal, así que aquí solo hace falta un stack sin cabecera —cada pantalla
 * dibuja su propio botón de cierre.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Palette.paper },
      }}
    />
  );
}
