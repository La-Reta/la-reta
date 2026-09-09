import {
  deleteOwnMatchComment,
  editOwnMatchComment,
} from "@/app/actions/match-comments";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string; commentId: string }>;
}

interface Body {
  body?: string;
  rating?: number;
}

/**
Los dos ids de la ruta, o `null` si alguno no es un entero positivo.
*/
async function ids(
  context: Context
): Promise<{ matchId: number; commentId: number } | null> {
  const { id, commentId } = await context.params;
  const matchId = parseId(id);
  const comment = parseId(commentId);
  return matchId === null || comment === null
    ? null
    : { matchId, commentId: comment };
}

/**
 * Corregir la propia reseña.
 *
 * La pertenencia la comprueba el `UPDATE` de la acción, filtrando por
 * `author_id` en la misma sentencia que escribe: así no queda hueco entre
 * comprobar y cambiar. Que no exista y que no sea tuya responden lo mismo, para
 * no ir diciendo qué reseñas hay.
 */
export const PATCH = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Inicia sesión para editar tu reseña.", 401);
  }

  const parsed = await ids(context);
  if (parsed === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const input = await readJson<Body>(request);
  if (input === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await editOwnMatchComment(parsed.matchId, parsed.commentId, {
    body: input.body ?? "",
    rating: input.rating ?? 0,
  });

  if (!result.ok) {
    // 403 y no 400: el cuerpo puede estar perfecto y la reseña no ser tuya.
    const status = result.error.startsWith("No puedes") ? 403 : 400;
    return jsonError(request, result.error, status);
  }

  return jsonOk(request, { ok: true });
});

/**
Borrar la propia reseña. Borrado suave: la fila queda, deja de verse.
*/
export const DELETE = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Inicia sesión para borrar tu reseña.", 401);
  }

  const parsed = await ids(context);
  if (parsed === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const result = await deleteOwnMatchComment(parsed.matchId, parsed.commentId);
  if (!result.ok) {
    return jsonError(request, result.error, 403);
  }

  return jsonOk(request, { ok: true });
});
