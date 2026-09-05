import { Stack } from "expo-router";
import type { ComponentProps } from "react";

import { Palette } from "@/constants/theme";

/**
 * El stack que vive dentro de cada pestaña.
 *
 * Existe para que las cinco compartan cabecera sin copiarla cinco veces: la
 * cara condensada de los titulares, el papel de fondo y el verde del botón de
 * volver se definen una sola vez aquí.
 *
 * Las tabs nativas no dibujan cabecera; sin este stack ninguna pantalla
 * tendría título grande ni sitio donde empujar una vista de detalle.
 */
export function TabStack(props: ComponentProps<typeof Stack>) {
  return (
    <Stack
      screenOptions={{
        // `headerLargeTitle` reservaba unos 100 pt en cada pantalla y no llegaba
        // a dibujar el título: solo dejaba una franja en blanco. Con la barra
        // compacta el título sale y el espacio vuelve al contenido.
        headerLargeTitle: false,
        headerShadowVisible: false,
        headerTintColor: Palette.accent,
        headerStyle: { backgroundColor: Palette.paper },
        headerLargeStyle: { backgroundColor: Palette.paper },
        headerTitleStyle: { color: Palette.ink },
        // Con etiqueta y no solo el chevron: en una pantalla empujada, saber
        // que "volver" lleva a Partidos o a Inicio ahorra el titubeo de mirar
        // la barra de pestañas para ubicarse.
        headerBackButtonDisplayMode: "default",
        contentStyle: { backgroundColor: Palette.paper },
      }}
      {...props}
    />
  );
}
