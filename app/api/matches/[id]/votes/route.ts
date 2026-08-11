import { getMatchVoteTally, getMyMatchVotes } from "@/lib/queries";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

/** Conteo de votos + el voto del usuario actual, para el polling "live". */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
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
