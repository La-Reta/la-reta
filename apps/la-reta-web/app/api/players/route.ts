import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// eslint-disable-next-line sonarjs/function-name -- el App Router exige este nombre exacto
export async function GET() {
  const players = await getPlayers();
  return Response.json(players);
}
