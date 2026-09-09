import { toggleMatchCommentReaction } from "@/app/actions/match-comments";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string; commentId: string }>;
}

interface Body {
  emoji?: string;
  /**
  Solo se mira sin sesión. Con sesión manda el userId de Clerk.
  */
  deviceKey?: string;
}

/**
 * Poner o quitar una reacción. Devuelve el estado resultante para que el
 * cliente quede sincronizado con la base, que es la que manda.
 *
 * **Quién reacciona lo decide el servidor cuando puede.** Con sesión, la clave
 * es el `userId` de Clerk y el cuerpo se ignora: si el cliente pudiera elegir
 * su identidad, cualquiera inflaría un contador mandando claves distintas. Sin
 * sesión se acepta un id del aparato, que es lo que ya hace la web —una
 * reacción anónima no puede ser mejor que eso—, y el índice único sigue
 * impidiendo el mismo emoji dos veces desde el mismo sitio.
 */
export const POST = handler<Context>(async (request, context) => {
  const { id, commentId } = await context.params;
  const matchId = parseId(id);
  const comment = parseId(commentId);
  if (matchId === null || comment === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const input = await readJson<Body>(request);
  if (input === null || typeof input.emoji !== "string") {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await toggleMatchCommentReaction({
    matchId,
    commentId: comment,
    emoji: input.emoji,
    deviceKey: input.deviceKey,
  });

  if (!result.ok) {
    return jsonError(request, result.error, 400);
  }

  return jsonOk(request, { ok: true, reacted: result.reacted });
});
