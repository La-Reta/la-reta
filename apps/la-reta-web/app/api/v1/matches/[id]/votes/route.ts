import type { VoteCategory } from "@/lib/match-votes";
import { VOTE_CATEGORY_KEYS } from "@/lib/match-votes";
import { getActor } from "@/lib/api/context";
import { INVALID_ID, parseId, readJson } from "@/lib/api/errors";
import { handler, jsonError, jsonOk, respond } from "@/lib/api/respond";
import { getMatchVoteTally, getMyMatchVotes } from "@/lib/queries";
import { castMatchVote, resetMatchVote } from "@/lib/services/match-votes";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

/**
El id de categoría llega como texto libre desde HTTP; se valida aquí.
*/
function isVoteCategory(value: string): value is VoteCategory {
  return (VOTE_CATEGORY_KEYS as readonly string[]).includes(value);
}

async function matchIdOf(context: Context): Promise<number | null> {
  const { id } = await context.params;
  return parseId(id);
}

/**
Conteo de votos + el voto del usuario actual, para el polling "live".
*/
export const GET = handler<Context>(async (request, context) => {
  const id = await matchIdOf(context);
  if (id === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const { userId } = await getActor();
  const [tally, myVotes] = await Promise.all([
    getMatchVoteTally(id),
    getMyMatchVotes(id, userId),
  ]);
  return jsonOk(request, { tally, myVotes });
});

export const POST = handler<Context>(async (request, context) => {
  const id = await matchIdOf(context);
  if (id === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const body = await readJson<{
    category?: VoteCategory;
    playerId?: number | null;
    guestName?: string | null;
  }>(request);
  if (body?.category === undefined) {
    return jsonError(request, "Falta 'category'.", 400);
  }

  const { userId } = await getActor();
  return respond(
    request,
    await castMatchVote(
      {
        matchId: id,
        category: body.category,
        playerId: body.playerId ?? null,
        guestName: body.guestName ?? null,
      },
      userId
    )
  );
});

export const DELETE = handler<Context>(async (request, context) => {
  const id = await matchIdOf(context);
  if (id === null) {
    return jsonError(request, INVALID_ID, 400);
  }

  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  if (category === null || !isVoteCategory(category)) {
    return jsonError(request, "Falta 'category' o es inválida.", 400);
  }

  const { userId } = await getActor();
  return respond(
    request,
    await resetMatchVote({ matchId: id, category }, userId)
  );
});

export { preflight as OPTIONS } from "@/lib/api/respond";
