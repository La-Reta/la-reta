import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { retaIcs } from "@/lib/reta-ics";

/**
 * La próxima reta, a la hoja de compartir.
 *
 * Se genera un `.ics` y se ofrece a compartir en vez de escribir en el
 * calendario con `expo-calendar`: ese módulo no corre en Expo Go y obliga a un
 * build nativo, y además pide permiso sobre los calendarios del usuario. Con el
 * archivo, iOS ofrece "Añadir a Calendario" y la app no toca —ni pide ver— el
 * calendario de nadie.
 *
 * Va a caché y no a documentos porque el archivo solo tiene que sobrevivir a la
 * hoja: en cuanto el sistema lo lee ya no le sirve a nadie, y el teléfono puede
 * tirarlo cuando necesite espacio.
 */
export async function shareRetaInvite(): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;

  const folder = new Directory(Paths.cache, "reta");
  folder.create({ idempotent: true });

  const file = new File(folder, "la-reta.ics");
  file.create({ overwrite: true });
  file.write(retaIcs());

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/calendar",
    UTI: "com.apple.ical.ics",
    dialogTitle: "Añadir la reta al calendario",
  });
}
