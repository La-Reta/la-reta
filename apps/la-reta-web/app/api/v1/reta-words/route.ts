import { handler, jsonOk } from "@/lib/api/respond";
import { getBannerWords } from "@/lib/queries";

export const dynamic = "force-dynamic";

export { preflight as OPTIONS } from "@/lib/api/respond";

/**
Las palabras que completan «La Reta ___» en el banner: la semilla de la casa
más las que aporta la gente desde /palabras, ya deduplicadas. Lectura pública,
igual que en la web.
*/
export const GET = handler(async (request) =>
  jsonOk(request, await getBannerWords())
);
