import { upload } from "@vercel/blob/client";
import imageCompression from "browser-image-compression";

/**
 * La subida de una foto de principio a fin, en un solo sitio.
 *
 * Vive aquí y no dentro de un componente porque hay dos que la necesitan —el
 * campo de foto del registro y la demo de `/uploader-demo`— y las reglas que
 * aplica (qué formatos entran, a cuánto se comprime, contra qué endpoint se
 * firma el token) tienen que ser las mismas en los dos: si divergen, una sube
 * algo que la otra rechaza y el fallo sale en producción.
 *
 * Nada de esto es la garantía: `/api/blob/upload` vuelve a validar sesión, tipo
 * y tamaño al firmar el token, que es lo único que el cliente no puede saltarse.
 */

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const OUTPUT_TYPE = "image/webp";
export const MAX_LONG_EDGE_PX = 1600;
export const DEFAULT_MAX_SIZE_MB = 0.3;

const UPLOAD_ENDPOINT = "/api/blob/upload";

export type UploadStage = "reading" | "compressing" | "uploading" | "done";

/**
 * Cómo se nombra cada etapa en pantalla. Vive aquí, junto al tipo, porque el
 * `Record` obliga a nombrar cualquier etapa nueva y porque el registro y el alta
 * enseñan el mismo proceso: si cada uno tuviera su copia, la misma subida se
 * llamaría distinto según la pantalla.
 */
export const STAGE_LABEL: Record<UploadStage, string> = {
  reading: "Leyendo la foto…",
  compressing: "Optimizando…",
  uploading: "Subiendo…",
  done: "Lista",
};

export interface UploadedPhoto {
  url: string;
  originalSize: number;
  compressedSize: number;
}

/**
 * Una subida en curso, tal y como la ve quien la pinta.
 *
 * Vive aquí y no en un campo de foto concreto porque la consumen los dos
 * previews —el del alta y el del registro— y el campo que la produce es distinto
 * en cada uno. Con el tipo dentro de uno de los campos, el otro formulario
 * acababa importando de una pantalla que no es la suya.
 */
export interface PhotoUpload {
  /**
  Object URL local: la carta pinta los bytes elegidos sin esperar a Blob.
  */
  readonly preview: string | null;
  readonly stage: UploadStage;
  /**
  0–1 sobre las dos etapas (comprimir + subir).
  */
  readonly progress: number;
}

interface UploadOptions {
  maxSizeMB?: number;
  onStage?: (stage: UploadStage) => void;
  onProgress?: (percent: number) => void;
}

export function isAcceptedType(
  type: string
): type is (typeof ACCEPTED_TYPES)[number] {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

/**
 * Verifica que el archivo sea REALMENTE una imagen decodificándolo, no solo
 * confiando en el MIME declarado, que es falsificable. Si no decodifica, lanza.
 */
async function assertRealImage(file: File): Promise<void> {
  const bitmap = await createImageBitmap(file);
  bitmap.close();
}

export async function uploadPhoto(
  file: File,
  options: UploadOptions = {}
): Promise<UploadedPhoto> {
  const { maxSizeMB = DEFAULT_MAX_SIZE_MB, onStage, onProgress } = options;

  if (!isAcceptedType(file.type)) {
    throw new Error("Formato no permitido. Usa JPEG, PNG o WebP.");
  }

  onStage?.("reading");
  onProgress?.(100);
  await assertRealImage(file);

  onStage?.("compressing");
  onProgress?.(0);
  const webp = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: MAX_LONG_EDGE_PX,
    // En un worker: recodificar una foto de teléfono bloquea el hilo principal
    // el tiempo suficiente para que la interfaz se sienta colgada.
    useWebWorker: true,
    fileType: OUTPUT_TYPE,
    onProgress: (percent: number) => onProgress?.(percent),
  });

  onStage?.("uploading");
  onProgress?.(0);
  // Nombre aleatorio: el original puede traer el nombre real de quien sube y
  // la URL de Blob es pública.
  const result = await upload(`${crypto.randomUUID()}.webp`, webp, {
    access: "public",
    contentType: OUTPUT_TYPE,
    handleUploadUrl: UPLOAD_ENDPOINT,
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  });

  onStage?.("done");
  onProgress?.(100);

  return {
    url: result.url,
    originalSize: file.size,
    compressedSize: webp.size,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function reductionPercent(original: number, compressed: number): number {
  if (original <= 0) {
    return 0;
  }
  return Math.max(0, Math.round((1 - compressed / original) * 100));
}

/**
 * Las dos etapas visibles como una sola barra de 0 a 1: comprimir ocupa la
 * primera mitad y subir la segunda.
 *
 * Sin esto el 100% de la compresión se lee como "ya está" y la barra vuelve a
 * cero al empezar la subida, que es justo cuando el usuario cree que terminó.
 * Vive aquí y no en cada campo de foto porque el reparto tiene que ser el mismo
 * en los dos: si divergen, la misma subida avanza distinto según la pantalla.
 */
export function overallProgress(stage: UploadStage, percent: number): number {
  if (stage === "reading") {
    return 0;
  }
  if (stage === "compressing") {
    return percent / 200;
  }
  if (stage === "uploading") {
    return 0.5 + percent / 200;
  }
  return 1;
}
