import { handler, jsonOk } from "@/lib/api/respond";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
Roster completo, ordenado por overall. Lectura pública, igual que en la web.
*/
export const GET = handler(async (request) =>
  jsonOk(request, await getPlayers())
);
