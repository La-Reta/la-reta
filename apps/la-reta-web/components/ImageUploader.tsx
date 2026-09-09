"use client";

import {
  ACCEPTED_TYPES,
  DEFAULT_MAX_SIZE_MB,
  formatBytes,
  MAX_LONG_EDGE_PX,
  reductionPercent,
  uploadPhoto,
  type UploadStage,
} from "@/lib/upload-photo";
import { useAuth } from "@clerk/nextjs";
import * as React from "react";

// La tubería (formatos, compresión, endpoint) vive en `lib/upload-photo.ts`:
// aquí solo queda la interfaz, que es lo único que no comparte con el campo de
// foto del registro.

type Stage = "idle" | UploadStage;

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Listo",
  reading: "Leyendo archivo…",
  compressing: "Optimizando imagen…",
  uploading: "Subiendo…",
  done: "¡Completado!",
};

type Props = {
  readonly onUploadComplete?: (url: string) => void;
  readonly maxSizeMB?: number;
};

// Componente
export const ImageUploader = ({
  onUploadComplete,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}: Props) => {
  const { isSignedIn } = useAuth();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  const [stage, setStage] = React.useState<Stage>("idle");
  const [progress, setProgress] = React.useState(0);
  const [originalSize, setOriginalSize] = React.useState<number | null>(null);
  const [compressedSize, setCompressedSize] = React.useState<number | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [resultUrl, setResultUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const busy =
    stage === "reading" || stage === "compressing" || stage === "uploading";

  // Revoca el object URL previo (evita fugas de memoria) y guarda el nuevo.
  // El linter no ve el revoke porque va por ref; sí se libera aquí y al
  // desmontar. El useCallback se queda: React Compiler no está activado en
  // este proyecto, así que quitarlo sí recrearía la función en cada render.
  // eslint-disable-next-line react-doctor/react-compiler-no-manual-memoization
  const setPreview = React.useCallback((blob: Blob | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke -- se revoca en la línea de arriba y al desmontar, vía previewUrlRef
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

  async function handleFile(file: File) {
    setError(null);
    setResultUrl(null);
    setOriginalSize(file.size);
    setPreview(file);

    // eslint-disable-next-line react-hooks/todo -- el compilador de React todavía no soporta try/finally; el código es correcto
    try {
      const result = await uploadPhoto(file, {
        maxSizeMB,
        onStage: setStage,
        onProgress: setProgress,
      });
      setCompressedSize(result.compressedSize);
      setResultUrl(result.url);
      onUploadComplete?.(result.url);
    } catch (err) {
      setError(errorMessage(err));
      setStage("idle");
      setProgress(0);
      setPreview(null);
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
          aria-label="Subir imagen"
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
          <progress
            value={progress}
            max={100}
            aria-label={STAGE_LABEL[stage]}
            className="h-2 w-full appearance-none overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800 [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-600 [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-neutral-200 dark:[&::-webkit-progress-bar]:bg-neutral-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600"
          />
        </div>
      ) : null}

      {/* Estado accesible (aria-live) */}
      <output
        id="image-uploader-status"
        aria-live="polite"
        className={`text-sm ${error ? "text-red-600" : "text-neutral-600 dark:text-neutral-300"}`}
      >
        {statusText}
      </output>

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
            rel="noopener noreferrer"
            className="block break-all text-blue-600 underline"
          >
            {resultUrl}
          </a>
        </div>
      ) : null}
    </div>
  );
};

const Metric = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) => {
  return (
    <div className="rounded-md border border-neutral-200 p-2 dark:border-neutral-800">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
};

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Ocurrió un error al procesar la imagen.";
}
