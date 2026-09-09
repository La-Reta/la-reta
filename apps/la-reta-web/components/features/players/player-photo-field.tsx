"use client";

import { FADE_DURATION, SPRING_POP } from "@/components/motion/motion-tokens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACCEPTED_TYPES,
  formatBytes,
  overallProgress,
  reductionPercent,
  type PhotoUpload,
  STAGE_LABEL,
  uploadPhoto,
  type UploadStage,
} from "@/lib/upload-photo";
import {
  CheckIcon,
  ImageUpIcon,
  LinkIcon,
  RefreshCwIcon,
  SparklesIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

/**
 * Lo que la carta necesita para enseñar la foto antes de que exista su URL.
 *
 * Sube al formulario en vez de quedarse aquí porque quien la pinta es la carta
 * de la derecha, no este campo: el estado tiene que vivir donde los dos lo ven.
 */
const URL_PREFIXES = ["http://", "https://", "/"];

/**
 * La foto del alta.
 *
 * **Aquí no se ve la foto.** La enseña la carta de la vista previa, que es donde
 * de verdad importa cómo queda: una miniatura aquí y la carta al lado son la
 * misma imagen dos veces, y la que manda —la que se va a guardar— es la carta.
 * Este campo solo dice en qué estado está y ofrece cambiarla o quitarla.
 *
 * Eso vale también para el alta que viene de una solicitud: la foto que mandó
 * el jugador llega ya puesta en la carta, no en un `input` que habría que mirar
 * para saber si hay algo. La URL se copia tal cual (no los bytes), así que
 * aprobar una solicitud no ocupa un byte más en el store.
 */
export const PlayerPhotoField = ({
  value,
  signupPhotoUrl,
  upload,
  onChange,
  onUploadChange,
  disabled,
}: {
  readonly value: string;
  /** La foto que traía la solicitud, cuando el alta viene de una. */
  readonly signupPhotoUrl?: string;
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
  const [urlDraft, setUrlDraft] = React.useState("");

  const stage = upload?.stage ?? null;
  const busy = stage !== null && stage !== "done";
  const locked = disabled || busy;
  const hasPhoto = Boolean(value) || busy;
  const fromSignup = Boolean(value) && value === signupPhotoUrl;

  // Revoca el object URL anterior antes de crear el nuevo (evita fugas) y
  // devuelve el nuevo, que hace falta en el mismo tick para reportarlo arriba.
  function swapPreview(blob: Blob | null) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke -- se revoca en la línea de arriba y al desmontar, vía previewUrlRef
    const next = blob ? URL.createObjectURL(blob) : null;
    previewUrlRef.current = next;
    return next;
  }

  React.useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    setSaved(null);
    // El object URL sale antes de comprimir: en un teléfono recodificar tarda
    // lo suyo, y hasta entonces la carta no tendría nada que enseñar.
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
    if (file) {
      void handleFile(file);
    }
  }

  function clear() {
    swapPreview(null);
    onUploadChange(null);
    onChange("");
    setSaved(null);
    setError(null);
    setUrlDraft("");
    resetInput();
  }

  /**
   * La URL pegada se confirma al salir del campo o con Enter, no en cada tecla:
   * con la primera letra el campo saltaría al estado "con foto" y la carta
   * intentaría pintar `h`.
   */
  function commitUrl() {
    const url = urlDraft.trim();
    if (!url) {
      return;
    }
    if (!URL_PREFIXES.some((prefix) => url.startsWith(prefix))) {
      setError("La URL tiene que empezar por https:// o por /.");
      return;
    }
    setError(null);
    setSaved(null);
    swapPreview(null);
    onUploadChange(null);
    onChange(url);
  }

  const title = busy
    ? STAGE_LABEL[stage ?? "reading"]
    : fromSignup
      ? "Foto de la solicitud"
      : "Foto lista";

  const hint = busy
    ? "Ya se ve en la carta mientras termina de subir."
    : fromSignup
      ? "Llegó con el registro y ya está en la carta. Se guarda tal cual."
      : saved
        ? `${formatBytes(saved.original)} → ${formatBytes(saved.compressed)} · ${reductionPercent(saved.original, saved.compressed)}% menos`
        : "Así queda en la carta.";

  return (
    <div className="@container">
      {/* El control de verdad son los botones, que llaman a `.click()` sobre
          este input. Con `tabIndex={-1}` el tabulador para una sola vez. */}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={SPRING_POP}
            className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-3 @sm:flex-row @sm:items-center"
          >
            <span
              aria-hidden="true"
              className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg"
            >
              {fromSignup ? (
                <SparklesIcon className="size-4" />
              ) : (
                <CheckIcon className="size-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{title}</p>
              <p className="text-muted-foreground text-xs">{hint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
                disabled={locked}
                onClick={clear}
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
            className="space-y-2"
          >
            <Button
              type="button"
              variant="outline"
              disabled={locked}
              onClick={openPicker}
              className="hover:border-primary/60 hover:bg-accent/40 h-auto w-full cursor-pointer flex-col items-center gap-2 border-dashed py-8 whitespace-normal"
            >
              <span className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-2xl">
                <ImageUpIcon className="size-5" />
              </span>
              <span className="text-sm font-medium">Sube la foto</span>
              <span className="text-muted-foreground text-xs font-normal">
                JPEG, PNG o WebP · aparece al momento en la carta
              </span>
            </Button>
            <div className="relative">
              <LinkIcon
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
              />
              <Input
                value={urlDraft}
                onChange={(event) => setUrlDraft(event.target.value)}
                onBlur={commitUrl}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitUrl();
                  }
                }}
                disabled={locked}
                placeholder="…o pega una URL: https://…"
                className="pl-8"
              />
            </div>
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
