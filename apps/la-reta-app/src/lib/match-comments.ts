import { request } from "@/lib/api";
import type { MatchReviews } from "@/lib/types";

/**
 * Reseñas de un partido contra `/api/v1/matches/:id/comments`.
 *
 * Quién firma no viaja en el cuerpo: el servidor saca nombre y foto de la
 * sesión de Clerk que va en el token. Mandarlos desde aquí sería dejar que
 * cualquiera firme como quien quiera.
 *
 * Lo mismo con las reacciones: con sesión, la clave de quien reacciona la pone
 * el servidor con el `userId`, y el `deviceKey` solo se mira cuando no hay
 * sesión. Si el cliente pudiera elegir su identidad, inflar un contador sería
 * mandar claves distintas.
 */

export async function fetchMatchReviews(
  matchId: string,
  reactorKey: string
): Promise<MatchReviews> {
  const query =
    reactorKey === "" ? "" : `?reactorKey=${encodeURIComponent(reactorKey)}`;
  return await request<MatchReviews>(
    `/api/v1/matches/${matchId}/comments${query}`
  );
}

export async function postMatchReview(
  matchId: string,
  input: { body: string; rating: number }
): Promise<void> {
  await request(`/api/v1/matches/${matchId}/comments`, {
    method: "POST",
    body: { ...input, client: {} },
  });
}

export async function editMatchReview(
  matchId: string,
  commentId: number,
  input: { body: string; rating: number }
): Promise<void> {
  await request(`/api/v1/matches/${matchId}/comments/${commentId}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deleteMatchReview(
  matchId: string,
  commentId: number
): Promise<void> {
  await request(`/api/v1/matches/${matchId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export async function toggleMatchReaction(
  matchId: string,
  commentId: number,
  emoji: string,
  deviceKey: string
): Promise<{ reacted: boolean }> {
  return await request<{ ok: true; reacted: boolean }>(
    `/api/v1/matches/${matchId}/comments/${commentId}/reactions`,
    { method: "POST", body: { emoji, deviceKey } }
  );
}
