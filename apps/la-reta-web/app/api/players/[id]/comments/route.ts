import { getCommentReactions, getPlayerComments } from "@/lib/queries";

export const dynamic = "force-dynamic";

// eslint-disable-next-line sonarjs/function-name -- el App Router exige este nombre exacto
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const playerId = Number(id);
  const [comments, reactions] = await Promise.all([
    getPlayerComments(playerId),
    getCommentReactions(playerId),
  ]);
  return Response.json({ comments, reactions });
}
