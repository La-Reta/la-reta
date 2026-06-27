import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const players = await getPlayers();
  return Response.json(players);
}
