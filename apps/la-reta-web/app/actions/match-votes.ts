"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import type {
  CastMatchVoteInput,
  ResetMatchVoteInput,
} from "@/lib/services/match-votes";
import type { ActionResult } from "@/lib/services/result";
import {
  castMatchVote as castMatchVoteService,
  resetMatchVote as resetMatchVoteService,
} from "@/lib/services/match-votes";
import { runAction } from "@/lib/services/result";

/**
 * Envoltorios sobre `lib/services/match-votes.ts`. La lógica vive ahí para que
 * el route handler de /api/v1 la comparta con la app móvil; aquí solo se
 * resuelve la sesión y se revalida la caché de Next.
 */

export async function castMatchVote(
  input: CastMatchVoteInput
): Promise<ActionResult> {
  const { userId } = await auth();
  return await runAction(
    async () => await castMatchVoteService(input, userId ?? null),
    () => {
      revalidatePath(`/matches/${input.matchId}/detail`);
    }
  );
}

export async function resetMatchVote(
  input: ResetMatchVoteInput
): Promise<ActionResult> {
  const { userId } = await auth();
  return await runAction(
    async () => await resetMatchVoteService(input, userId ?? null),
    () => {
      revalidatePath(`/matches/${input.matchId}/detail`);
    }
  );
}
