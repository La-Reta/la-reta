/**
 * Recorta un texto y lo acota; vacío cuenta como ausente, que es lo que guardan
 * las tablas.
 *
 * Estaba copiado tres veces —`reports`, `legal` y `player-signups`— con la misma
 * firma y el mismo tope implícito. Copiada, la primera vez que alguien cambie la
 * regla (por ejemplo, normalizar espacios dobles) solo la cambia en uno.
 */
export function safeText(
  value: string | null | undefined,
  maxLength: number
): string | null {
  const clean = value?.trim();
  return clean === undefined || clean === "" ? null : clean.slice(0, maxLength);
}

/**
 * Como `safeText` pero sin tope: el campo o `null` si viene vacío. Para columnas
 * de texto libre (`user_agent`, notas) donde recortar sería perder información.
 */
export function optionalText(value: string | null | undefined): string | null {
  const clean = value?.trim();
  return clean === undefined || clean === "" ? null : clean;
}
