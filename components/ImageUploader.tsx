"use client";

import { useAuth } from "@clerk/nextjs";
import { upload } from "@vercel/blob/client";
import imageCompression from "browser-image-compression";
import * as React from "react";

// ── Constantes ───────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const OUTPUT_TYPE = "image/webp";
const MAX_LONG_EDGE_PX = 1600;
const DEFAULT_MAX_SIZE_MB = 0.3;
const UPLOAD_ENDPOINT = "/api/blob/upload";

type Stage = "idle" | "reading" | "compressing" | "uploading" | "done";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Listo",
  reading: "Leyendo archivo…",
  compressing: "Optimizando imagen…",
  uploading: "Subiendo…",
  done: "¡Completado!",
};

type Props = {
  onUploadComplete?: (url: string) => void;
  maxSizeMB?: number;
};

// ── Helpers puros ────────────────────────────────────────────────────────────
function isAcceptedType(type: string): type is (typeof ACCEPTED_TYPES)[number] {
  return (ACCEPTED_TYPES as readonly string[]).includes(type);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function reductionPercent(original: number, compressed: number): number {
  if (original <= 0) return 0;
  return Math.max(0, Math.round((1 - compressed / original) * 100));
}

/**
 * Verifica que el archivo sea REALMENTE una imagen decodificándolo, no solo
 * confiando en el MIME declarado (que es falsificable). Si no decodifica, lanza.
 */
async function assertRealImage(file: File): Promise<void> {
  const bitmap = await createImageBitmap(file);
  bitmap.close();
}

async function compressToWebp(
  file: File,
  maxSizeMB: number,
  onProgress: (percent: number) => void,
): Promise<File> {
  return imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight: MAX_LONG_EDGE_PX,
    useWebWorker: true, // no bloquea la UI
    fileType: OUTPUT_TYPE,
    onProgress,
  });
}

// ── Componente ───────────────────────────────────────────────────────────────
export function ImageUploader({
  onUploadComplete,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: Props) {
  const { isSignedIn } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  const [stage, setStage] = React.useState<Stage>("idle");
  const [progress, setProgress] = React.useState(0);
  const [originalSize, setOriginalSize] = React.useState<number | null>(null);
  const [compressedSize, setCompressedSize] = React.useState<number | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const busy = stage === "reading" || stage === "compressing" || stage === "uploading";

  // Revoca el object URL previo (evita fugas de memoria) y guarda el nuevo.
  const setPreview = React.useCallback((blob: Blob | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const next = blob ? URL.createObjectURL(blob) : null;
    previewUrlRef.current = next;
    setPreviewUrl(next);
  }, []);

  // Limpieza final al desmontar.
  React.useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function fail(message: string) {
    setError(message);
    setStage("idle");
    setProgress(0);
    resetInput();
  }

  async function handleFile(file: File) {
    setError(null);
    setResultUrl(null);
    setOriginalSize(file.size);

    // 1) Validación de tipo (no confiar solo en el atributo `accept`).
    if (!isAcceptedType(file.type)) {
      fail("Formato no permitido. Usa JPEG, PNG o WebP.");
      return;
    }

    try {
      // 2) Lectura + validación real de imagen.
      setStage("reading");
      setProgress(100);
      await assertRealImage(file);

      // 3) Compresión → WebP (progreso real vía onProgress).
      setStage("compressing");
      setProgress(0);
      const webp = await compressToWebp(file, maxSizeMB, setProgress);
      setCompressedSize(webp.size);
      setPreview(webp);

      // 4) Subida directa navegador → Blob (progreso real vía onUploadProgress).
      setStage("uploading");
      setProgress(0);
      const filename = `${crypto.randomUUID()}.webp`;
      const result = await upload(filename, webp, {
        access: "public",
        contentType: OUTPUT_TYPE,
        handleUploadUrl: UPLOAD_ENDPOINT,
        onUploadProgress: ({ percentage }) => setProgress(percentage),
      });

      setStage("done");
      setProgress(100);
      setResultUrl(result.url);
      onUploadComplete?.(result.url);
    } catch (err) {
      fail(errorMessage(err));
    } finally {
      resetInput();
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  const statusText = error ? error : STAGE_LABEL[stage];

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="image-uploader" className="block text-sm font-medium">
          Subir imagen
        </label>
        <input
          ref={inputRef}
          id="image-uploader"
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={onChange}
          disabled={busy || isSignedIn === false}
          aria-describedby="image-uploader-status"
          aria-busy={busy}
          className="block w-full cursor-pointer rounded-md border border-neutral-300 text-sm file:mr-3 file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:file:bg-neutral-800"
        />
        <p className="text-xs text-neutral-500">
          JPEG, PNG o WebP · se optimiza a WebP (máx {MAX_LONG_EDGE_PX}px, ~
          {Math.round(maxSizeMB * 1000)}KB).
        </p>
      </div>

      {/* Necesita sesión para subir */}
      {isSignedIn === false ? (
        <p
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
        >
          Debes iniciar sesión para subir imágenes.
        </p>
      ) : null}

      {/* Barra de progreso por etapas (solo etapas locales/subida, sin % de red inventado) */}
      {busy || stage === "done" ? (
        <div className="space-y-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={STAGE_LABEL[stage]}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Estado accesible (aria-live) */}
      <p
        id="image-uploader-status"
        role="status"
        aria-live="polite"
        className={`text-sm ${error ? "text-red-600" : "text-neutral-600 dark:text-neutral-300"}`}
      >
        {statusText}
      </p>

      {/* Métricas de tamaño */}
      {originalSize != null ? (
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <Metric label="Original" value={formatBytes(originalSize)} />
          <Metric
            label="Optimizado"
            value={compressedSize != null ? formatBytes(compressedSize) : "—"}
          />
          <Metric
            label="Reducción"
            value={
              compressedSize != null
                ? `${reductionPercent(originalSize, compressedSize)}%`
                : "—"
            }
          />
        </dl>
      ) : null}

      {/* Vista previa de la imagen optimizada */}
      {previewUrl ? (
        <figure className="space-y-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- object URL local, no aplica next/image */}
          <img
            src={previewUrl}
            alt="Vista previa de la imagen optimizada"
            className="max-h-64 w-full rounded-md object-contain"
          />
          <figcaption className="text-center text-xs text-neutral-500">
            Vista previa (WebP optimizado)
          </figcaption>
        </figure>
      ) : null}

      {/* URL final */}
      {resultUrl ? (
        <div className="space-y-1 text-xs">
          <p className="font-medium text-neutral-600 dark:text-neutral-300">
            URL en Vercel Blob:
          </p>
          <a
            href={resultUrl}
            target="_blank"
            rel="noreferrer"
            className="block break-all text-blue-600 underline"
          >
            {resultUrl}
          </a>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error al procesar la imagen.";
}
