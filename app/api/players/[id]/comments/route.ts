import { getCommentReactions, getPlayerComments } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const playerId = Number(id);
  const [comments, reactions] = await Promise.all([
    getPlayerComments(playerId),
    getCommentReactions(playerId),
  ]);
  return Response.json({ comments, reactions });
}
