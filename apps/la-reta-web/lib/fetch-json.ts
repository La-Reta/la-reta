/**
 * Un GET que devuelve JSON tipado.
 *
 * `Response.json()` devuelve `any` por contrato del DOM: no hay forma de tiparlo
 * sin una aserción, y hacerla en cada hook era repetir la misma decisión tres
 * veces. Aquí va una sola vez, con el error ya traducido a un `Error` con
 * mensaje — que es lo que TanStack Query enseña cuando falla.
 *
 * No valida la forma del JSON. Si algún día hace falta, este es el sitio.
 */
export async function fetchJson<T>(url: string, failure: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(failure);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- `json()` es `any` por contrato del DOM
  return (await response.json()) as T;
}
