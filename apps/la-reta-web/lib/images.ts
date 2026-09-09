// eslint-disable-next-line import-x/no-named-as-default -- `sharp` es su propio default export
import sharp from "sharp";

/**
 * Lado máximo de una imagen guardada. Una foto de celular de 4000 px no aporta
 * nada en una tarjeta de 300 px y pesa 20×; 1600 alcanza para verse bien en
 * pantallas retina sin inflar el Blob store.
 */
export const MAX_SIDE = 1600;
/**
80 es el punto donde WebP deja de verse distinto del original a simple vista.
*/
export const WEBP_QUALITY = 80;

export interface OptimizedImage {
  data: Buffer;
  contentType: "image/webp";
  width: number;
  height: number;
  bytes: number;
}

/**
 * Convierte cualquier imagen (JPEG, PNG, HEIC vía libvips, GIF, WebP…) a WebP y
 * la acota a `maxSide`. Compartida por todas las subidas del servidor, así que
 * lo que llegue al Blob store siempre está normalizado.
 *
 * Lo importante:
 *  - `fit: "inside"` + `withoutEnlargement` → **nunca deforma ni estira**: cabe
 *    dentro de la caja conservando la proporción, y una imagen chica se queda
 *    como está.
 *  - `.rotate()` sin argumentos aplica la orientación EXIF antes de redimensionar
 *    (si no, las fotos de celular salen acostadas y los metadatos se pierden al
 *    reencodear).
 *  - `animated: true` conserva los cuadros de un GIF/WebP animado en vez de
 *    quedarse con el primero.
 *
 * ponytail: siempre reencodea, incluso si ya venía en WebP. Un branch de
 * "déjala pasar" ahorraría poco y hay que redimensionar de todos modos; si
 * algún día importa la doble compresión, comparar `metadata.format` y el tamaño
 * antes de tocarla.
 */
export async function toWebp(
  input: ArrayBuffer | Buffer | Uint8Array,
  { maxSide = MAX_SIDE, quality = WEBP_QUALITY } = {}
): Promise<OptimizedImage> {
  // `Buffer.from` tiene sobrecargas para ArrayBuffer y para Uint8Array, pero la
  // unión de las dos no encaja en ninguna: el `as never` es para elegir una, no
  // para tapar un tipo dudoso.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- desambigua sobrecargas de Buffer.from
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input as never);

  const { data, info } = await sharp(buffer, { animated: true })
    .rotate()
    .resize({
      width: maxSide,
      height: maxSide,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    contentType: "image/webp",
    width: info.width,
    // En animadas, `info.height` trae el alto de la tira completa (alto × cuadros).
    height: info.pageHeight ?? info.height,
    bytes: data.byteLength,
  };
}

/**
`foto.JPG` → `foto.webp`; sin nombre usable, un genérico.
*/
export function webpName(name: string | undefined): string {
  const base = (name ?? "").replace(/\.[^./\\]+$/u, "").trim();
  return `${base || "imagen"}.webp`;
}

/**
 * Comprobación de que `toWebp` hace lo que dice, al alcance de un comando.
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`images demo failed: ${message}`);
  }
}

// self-check (npx tsx lib/images.ts)
export async function demo() {
  // Imagen de prueba grande y claramente rectangular (2:1).
  const source = await sharp({
    create: {
      width: 2400,
      height: 1200,
      channels: 3,
      background: { r: 20, g: 120, b: 70 },
    },
  })
    .png()
    .toBuffer();

  const out = await toWebp(source);
  assert(out.width === MAX_SIDE, `se acota al lado mayor (${out.width})`);
  assert(
    out.width / out.height === 2,
    `conserva la proporción (${out.width}×${out.height})`
  );
  assert(out.bytes < source.byteLength, "pesa menos que el original");
  const meta = await sharp(out.data).metadata();
  assert(meta.format === "webp", "el buffer resultante es webp de verdad");

  // Una imagen chica no se estira ni se agranda.
  const small = await sharp({
    create: { width: 120, height: 90, channels: 3, background: "#fff" },
  })
    .jpeg()
    .toBuffer();
  const smallOut = await toWebp(small);
  assert(
    smallOut.width === 120 && smallOut.height === 90,
    "no agranda las chicas"
  );

  assert(webpName("Foto de la Reta.JPEG") === "Foto de la Reta.webp", "nombre");
  assert(webpName(undefined) === "imagen.webp", "nombre por default");

  return "ok";
}

// Punto de entrada de script, no flujo de la app: no se puede `await` en el tope
// de un módulo que la app importa, así que aquí la cadena de promesas es lo
// correcto.
/* eslint-disable unicorn/prefer-await, github/no-then, promise/prefer-await-to-then, promise/prefer-await-to-callbacks, @typescript-eslint/use-unknown-in-catch-callback-variable -- entrada de script */
if (process.argv[1]?.endsWith("images.ts")) {
  demo()
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
/* eslint-enable unicorn/prefer-await, github/no-then, promise/prefer-await-to-then, promise/prefer-await-to-callbacks, @typescript-eslint/use-unknown-in-catch-callback-variable */
