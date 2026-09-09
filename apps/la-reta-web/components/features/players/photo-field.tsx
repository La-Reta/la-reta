"use client";

import { FADE_DURATION } from "@/components/motion/motion-tokens";
import { Button } from "@/components/ui/button";
import {
  ACCEPTED_TYPES,
  formatBytes,
  MAX_LONG_EDGE_PX,
  overallProgress,
  type PhotoUpload,
  reductionPercent,
  STAGE_LABEL,
  uploadPhoto,
  type UploadStage,
} from "@/lib/upload-photo";
import {
  ImageUpIcon,
  RefreshCwIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

/**
 * La foto del registro.
 *
 * **Aquí no se ve la foto**, igual que en el alta: la enseña `SignupPreviewCard`,
 * que es donde de verdad importa cómo queda. Una miniatura aquí y la carta al
 * lado son la misma imagen dos veces, y la que manda es la carta. Este campo
 * solo dice en qué estado está y ofrece cambiarla o quitarla.
 *
 * No comprueba la sesión: solo se pinta detrás de `SignupGate`, que ya exige
 * cuenta. Quien la exige de verdad es `/api/blob/upload` al firmar el token.
 *
 * A diferencia del campo del alta no deja pegar una URL: esa es una salida de
 * emergencia de admin, y quien se registra sube su foto y ya.
 */
export const PhotoField = ({
  value,
  upload,
  onChange,
  onUploadChange,
  disabled,
}: {
  readonly value: string;
  readonly upload: PhotoUpload | null;
  readonly onChange: (url: string) => void;
  readonly onUploadChange: (upload: PhotoUpload | null) => void;
  readonly disabled?: boolean;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previewUrlRef = React.useRef<string | null>(null);

  const [saved, setSaved] = React.useState<{
    original: number;
    compressed: number;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const stage = upload?.stage ?? null;
  const busy = stage !== null && stage !== "done";
  const hasPhoto = Boolean(upload?.preview ?? value);
  const locked = disabled || busy;

  // Revoca el object URL previo (evita fugas) y devuelve el nuevo. El linter no
  // ve el revoke porque va por ref; se libera aquí y al desmontar.
  function swapPreview(blob: Blob | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke -- se revoca en la línea de arriba y al desmontar, vía previewUrlRef
    const next = blob ? URL.createObjectURL(blob) : null;
    previewUrlRef.current = next;
    return next;
  }

  React.useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    setSaved(null);
    // El object URL sale antes de comprimir: en un teléfono recodificar tarda lo
    // suyo, y hasta entonces la carta no tendría nada que enseñar.
    const preview = swapPreview(file);
    let current: UploadStage = "reading";
    const report = (percent: number) =>
      onUploadChange({
        preview,
        stage: current,
        progress: overallProgress(current, percent),
      });
    report(0);

    // eslint-disable-next-line react-hooks/todo -- el compilador de React todavía no soporta try/finally; el código es correcto
    try {
      const result = await uploadPhoto(file, {
        onStage: (next) => {
          current = next;
          report(0);
        },
        onProgress: report,
      });
      onChange(result.url);
      setSaved({
        original: result.originalSize,
        compressed: result.compressedSize,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir la foto."
      );
      swapPreview(null);
      onUploadChange(null);
    } finally {
      resetInput();
    }
  }

  function onPick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
  }

  function clear() {
    swapPreview(null);
    onUploadChange(null);
    onChange("");
    setSaved(null);
    setError(null);
    resetInput();
  }

  return (
    <div className="@container">
      {/* El control de verdad son los botones: un `<label htmlFor>` haría lo
          mismo, pero envuelto en `Button` el texto queda fuera del alcance del
          analizador y no hay forma de comprobar que la etiqueta dice algo. Con
          `tabIndex={-1}` el tabulador para una sola vez, en el botón. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={onPick}
        disabled={locked}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <AnimatePresence initial={false} mode="wait">
        {hasPhoto ? (
          <m.div
            key="filled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION }}
            className="bg-muted/40 flex flex-wrap items-center gap-3 rounded-xl border p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {busy ? STAGE_LABEL[stage ?? "reading"] : "Foto lista"}
              </p>
              <p className="text-muted-foreground text-xs text-balance">
                {saved
                  ? `${formatBytes(saved.original)} → ${formatBytes(saved.compressed)} · ${reductionPercent(saved.original, saved.compressed)}% menos`
                  : "Mírala en la carta de al lado."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={locked}
                onClick={openPicker}
              >
                <RefreshCwIcon />
                Cambiar
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clear}
                disabled={locked}
              >
                <Trash2Icon />
                Quitar
              </Button>
            </div>
          </m.div>
        ) : (
          <m.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_DURATION }}
          >
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={openPicker}
              // Alto generoso y ancho completo: en el teléfono esto es el
              // objetivo táctil, no un `input file` de 20 px de alto.
              className="hover:border-primary/60 hover:bg-accent/40 h-auto w-full cursor-pointer flex-col items-center gap-2 border-dashed py-8 whitespace-normal"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                <ImageUpIcon className="size-5" />
              </span>
              <span className="text-sm font-medium">Sube tu foto</span>
              <span className="text-muted-foreground text-xs font-normal">
                JPEG, PNG o WebP · máx {MAX_LONG_EDGE_PX} px · opcional
              </span>
            </Button>
          </m.div>
        )}
      </AnimatePresence>

      {error ? (
        <p
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"
        >
          <TriangleAlertIcon className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
};
