import { Image } from "expo-image";
import { useState } from "react";
import { View } from "react-native";

import { Palette } from "@/constants/theme";
import { photoSource } from "@/lib/photos";

/**
 * La foto del partido: casi siempre la grupal, a veces la captura del
 * marcador.
 *
 * Tiene dos trabajos distintos y por eso dos modos:
 *
 *  - **`band`**, en el listado. Recorte fijo para que cinco tarjetas con cinco
 *    fotos de proporciones distintas sigan siendo una lista y no un collage.
 *    A 16:9 y no a una franja más ancha: casi todas rondan ya esa proporción,
 *    así que apretarlas más apenas ahorra veinte puntos de alto y en cambio se
 *    lleva contenido por delante —una de las "fotos" es la gráfica de la
 *    convocatoria, y a 2:1 le cortaba una fila de la alineación—. El corte
 *    agarra por arriba (`top center`), aquí y en el otro modo: en una foto de
 *    equipo lo que sobra siempre es el suelo, nunca las caras.
 *  - **`full`**, en la ficha. Ahí la foto es el documento del partido, así que
 *    se enseña con su propia proporción en vez de recortada a una franja. Se
 *    mide al cargar y hasta entonces el hueco se reserva a 16:9, que es lo que
 *    miden casi todas: solo da un salto la vertical, y solo la primera vez
 *    —después la trae la caché.
 *
 *    Con un tope, eso sí: cuadrada como mucho. Una vertical a su proporción
 *    real ocupaba la pantalla entera y dejaba el marcador debajo del pliegue
 *    —se abría un partido y no se veía cómo quedó—, así que `MIN_ASPECT` la
 *    recorta. Sigue siendo una foto grande, a todo el ancho, y el resultado no
 *    se pierde de vista.
 *
 * En ninguno de los dos hay texto encima. La cifra del marcador vive en la
 * tipografía, que es donde esta app la ha puesto siempre; superponerla sobre
 * un degradado oscuro convertiría la ficha en cualquier plantilla.
 */

const BAND_ASPECT = 16 / 9;
/** El mismo, reservando hueco mientras se mide la de la ficha. */
const TYPICAL_ASPECT = BAND_ASPECT;
/** Ni más plana ni más alta que esto, por rara que venga la original. */
const MIN_ASPECT = 1;
const MAX_ASPECT = 2.4;

export type MatchPhotoProps = {
  url: string | null;
  /** Para lectores de pantalla: qué partido es esta foto. */
  alt: string;
  mode?: "band" | "full";
  /** Redondeo; en las tarjetas lo pone el propio borde recortado. */
  radius?: number;
};

export function MatchPhoto({
  url,
  alt,
  mode = "band",
  radius = 0,
}: MatchPhotoProps) {
  const source = photoSource(url);
  const [natural, setNatural] = useState<number | null>(null);

  if (source === null) return null;

  const aspect = mode === "band" ? BAND_ASPECT : (natural ?? TYPICAL_ASPECT);

  return (
    <View
      style={{
        width: "100%",
        aspectRatio: aspect,
        borderRadius: radius,
        borderCurve: "continuous",
        overflow: "hidden",
        // Un hueco del color hundido mientras llega: en blanco, la tarjeta
        // parpadea de vacía a llena y se lee como un fallo de carga.
        backgroundColor: Palette.surfaceSunken,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        alt={alt}
        contentFit="cover"
        contentPosition="top center"
        onLoad={({ source: loaded }) => {
          if (mode === "band" || loaded.height === 0) return;
          setNatural(
            clamp(loaded.width / loaded.height, MIN_ASPECT, MAX_ASPECT)
          );
        }}
        source={source}
        style={{ width: "100%", height: "100%" }}
        transition={220}
      />
    </View>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
