import {
  Oswald_400Regular,
  Oswald_500Medium,
  Oswald_700Bold,
} from "@expo-google-fonts/oswald";
import { useFonts } from "expo-font";

/**
 * Carga la cara condensada que la web usa para marcadores y titulares.
 *
 * Un fallo al cargarla no bloquea el arranque: el sistema sustituye la fuente
 * y la app abre con otra tipografía, que es mucho mejor que quedarse en la
 * pantalla de bienvenida para siempre.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Oswald_400Regular,
    Oswald_500Medium,
    Oswald_700Bold,
  });

  return loaded || error !== null;
}
