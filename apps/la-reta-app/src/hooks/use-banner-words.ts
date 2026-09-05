import { useApi } from "@/hooks/use-api";

/**
 * Las palabras que completan «La Reta ___» en el banner de Inicio.
 *
 * Vienen de `/api/v1/reta-words`, que ya mezcla la semilla de la casa con las
 * que aporta la gente desde la web y las deduplica: aquí no hay nada que
 * combinar, solo que enseñar.
 *
 * La semilla se repite abajo a propósito. Es el titular de la portada y sin
 * señal —o mientras la petición viaja— la frase se quedaría coja, que es peor
 * que enseñar ocho palabras algo desactualizadas. Es la misma lista que
 * apps/la-reta-web/constants/rotatingWords.ts; cuando exista un paquete de
 * contrato compartido, este es de los primeros que debe mudarse.
 */
const SEED_WORDS = [
  "Credix",
  "de los jueves",
  "cascarita",
  "sagrada",
  "del barrio",
  "clásica",
  "inquebrantable",
  "de los JOCHIS",
];

export function useBannerWords(): string[] {
  const { data } = useApi<string[]>("/api/v1/reta-words");

  return data === null || data.length === 0 ? SEED_WORDS : data;
}
