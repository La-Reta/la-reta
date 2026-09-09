import type { CommentInput } from "@/lib/comments";
import { addMatchComment } from "@/app/actions/match-comments";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk } from "@/lib/api/respond";
import {
  getMatchById,
  getMatchCommentMine,
  getMatchCommentReactions,
  getMatchComments,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

interface Context {
  params: Promise<{ id: string }>;
}

/**
 * Las reseñas de un partido, con su recuento de reacciones y la nota media.
 *
 * Va en una sola respuesta y no en tres rutas: la app pinta la sección entera de
 * una vez, y pedir lista, reacciones y media por separado serían tres viajes
 * para dibujar un solo bloque.
 *
 * `mine` dice qué emojis puso quien pregunta, para que sus propias reacciones
 * salgan marcadas. Sale del `reactorKey` que manda el cliente —el `userId` de
 * Clerk con sesión, un id del aparato sin ella—, nunca de una lista de quién
 * reaccionó a qué: eso es de cada quien y no tiene por qué viajar.
 */
export const GET = handler<Context>(async (request, context) => {
  const { id } = await context.params;
  const matchId = parseId(id);
  if (matchId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const url = new URL(request.url);
  const reactorKey = (url.searchParams.get("reactorKey") ?? "").slice(0, 64);

  const [comments, reactions, mine, { userId }] = await Promise.all([
    getMatchComments(matchId),
    getMatchCommentReactions(matchId),
    getMatchCommentMine(matchId, reactorKey),
    getActor(),
  ]);
  const rated = comments.filter((row) => row.rating !== null);
  const average =
    rated.length === 0
      ? null
      : rated.reduce((total, row) => total + (row.rating ?? 0), 0) /
        rated.length;

  // Función con nombre y no un arrow: `unicorn/consistent-arrow-return-style`
  // pide bloque con `return` cuando el cuerpo es multilínea y `arrow-body-style`
  // lo prohíbe cuando solo devuelve — con las dos activas, ningún arrow pasa.
  function toDto(row: (typeof comments)[number]) {
    return {
      id: row.id,
      author: row.author,
      authorImageUrl: row.authorImageUrl,
      body: row.body,
      rating: row.rating,
      createdAt: row.createdAt.toISOString(),
      mine: userId !== null && row.authorId === userId,
      reactions: reactions[row.id] ?? {},
      myReactions: mine[row.id] ?? [],
    };
  }

  return jsonOk(request, {
    // `mine` por comentario en vez de `authorId`: quién escribió cada reseña no
    // hace falta que salga de aquí, y el cliente solo necesita saber cuáles
    // puede editar.
    comments: comments.map(toDto),
    rating: { average, votes: rated.length },
    reactorKey: reactorKey === "" ? null : reactorKey,
  });
});

/**
 * Dejar una reseña de un partido.
 *
 * Quién la firma lo decide el token, no el cuerpo: `addMatchComment` saca el
 * nombre y la foto de Clerk. Lo único que manda el cliente es el texto y la
 * nota.
 *
 * A diferencia de las reseñas de jugador, aquí no hay regla de "no te reseñes a
 * ti mismo": un partido no tiene dueño al que proteger.
 */
export const POST = handler<Context>(async (request, context) => {
  const { userId } = await getActor();
  if (userId === null) {
    return jsonError(request, "Inicia sesión para dejar tu reseña.", 401);
  }

  const { id } = await context.params;
  const matchId = parseId(id);
  if (matchId === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const match = await getMatchById(matchId);
  if (match === null) {
    return jsonError(request, "Partido no encontrado.", 404);
  }

  // `Partial`: esto es JSON de fuera, no un objeto que hayamos construido
  // nosotros. Tipándolo completo, TypeScript da `client` por presente y marca
  // el `??` de abajo como innecesario — justo el que salva a un cuerpo que
  // llegue sin él.
  const body = await readJson<Partial<CommentInput>>(request);
  if (body === null) {
    return jsonError(request, "Cuerpo inválido.", 400);
  }

  const result = await addMatchComment(matchId, {
    body: body.body ?? "",
    rating: body.rating ?? 0,
    client: body.client ?? {},
  });

  if (!result.ok) {
    return jsonError(request, result.error, 400);
  }

  return jsonOk(request, { ok: true }, 201);
});
