import { handler, jsonOk } from "@/lib/api/respond";
import { getMatches } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
Partidos con sus goleadores. Lectura pública.
*/
export const GET = handler(async (request) =>
  jsonOk(request, await getMatches())
);
