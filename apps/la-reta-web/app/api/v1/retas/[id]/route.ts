import { INVALID_ID, parseId } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import { getGeneratedRetas } from "@/lib/queries";
import { toRetaDTO } from "@/lib/retas-dto";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Una reta por id — lo que abre un link compartido.
 *
 * Se filtra sobre la lista reciente en vez de consultar por id porque
 * `getGeneratedRetas` ya resuelve los nombres y los invitados de una tacada, y
 * duplicar esa consulta para una fila sería mantener dos veces el mismo join.
 * Si el historial crece a miles, aquí es donde toca una consulta propia.
 */
export const GET = handler<Context>(async (request, context) => {
  const parameters = await context.params;
  const id = parseId(parameters.id);
  if (id === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const retas = await getGeneratedRetas();
  const reta = retas.find((row) => row.id === id);
  return reta
    ? jsonOk(request, toRetaDTO(reta))
    : jsonError(request, "No encontramos esa reta.", 404);
});
