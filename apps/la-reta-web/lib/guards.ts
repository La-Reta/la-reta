/**
 * ¿El valor es uno de los de la lista?
 *
 * Sustituye al patrón `LISTA.includes(x as T) ? (x as T) : "otro"`, que estaba
 * repetido en cinco actions: la aserción le decía a TypeScript que el dato ya
 * era del tipo bueno **antes** de comprobarlo, así que si un día la lista y el
 * tipo dejaban de coincidir, nadie se enteraba. Como type guard, el estrechado
 * lo hace la comprobación y no una promesa.
 */
export function inList<const T extends readonly string[]>(
  list: T,
  value: unknown
): value is T[number] {
  return (
    typeof value === "string" && (list as readonly string[]).includes(value)
  );
}
