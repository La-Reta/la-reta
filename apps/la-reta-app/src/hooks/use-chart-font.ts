import { Oswald_500Medium } from "@expo-google-fonts/oswald";
import { useFont, type SkFont } from "@shopify/react-native-skia";

/**
 * La cara de los ejes.
 *
 * Skia dibuja su propio texto y no ve las familias que registró `expo-font`,
 * así que hay que darle el .ttf a mano. Va en Oswald como el resto de las
 * cifras de la app: unos ejes en la cara del sistema harían que la gráfica
 * pareciera pegada de otro producto.
 *
 * Devuelve `null` mientras carga. Las gráficas dibujan igual —solo salen sin
 * etiquetas un instante—, así que nadie tiene que esperar por esto.
 */
export function useChartFont(size: number): SkFont | null {
  return useFont(Oswald_500Medium, size);
}
