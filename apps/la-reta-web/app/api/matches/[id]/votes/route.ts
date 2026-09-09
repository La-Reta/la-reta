import { auth } from "@clerk/nextjs/server";
import { getMatchVoteTally, getMyMatchVotes } from "@/lib/queries";

export const dynamic = "force-dynamic";

/**
Conteo de votos + el voto del usuario actual, para el polling "live".
*/
// eslint-disable-next-line sonarjs/function-name -- el App Router exige este nombre exacto
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const matchId = Number(id);
  const { userId: voterId } = await auth();
  const [tally, myVotes] = await Promise.all([
    getMatchVoteTally(matchId),
    getMyMatchVotes(matchId, voterId),
  ]);
  return Response.json({ tally, myVotes });
}
