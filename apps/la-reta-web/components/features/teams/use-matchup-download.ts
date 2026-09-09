"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import type { MatchupView } from "@/components/features/teams/constants";

/**
Tope de espera de la exportación, antes de rendirse y avisar.
*/
const EXPORT_TIMEOUT_MS = 20_000;

/**
 * Promesa que solo sabe fallar, pasado `ms`. Es la única forma de ponerle tope
 * a `toPng`, que no admite señal de cancelación.
 */
async function rejectAfter(ms: number): Promise<never> {
  // eslint-disable-next-line promise/avoid-new -- no hay API que envuelva un setTimeout como promesa
  return await new Promise((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error("La exportación tardó demasiado"));
    }, ms);
  });
}

/**
 * Refs + acción para exportar el matchup como PNG. Se prefiere la copia oculta
 * (a tamaño desktop) sobre la visible, así la descarga desde mobile respeta el
 * tamaño completo. html-to-image se importa de forma perezosa.
 */
export function useMatchupDownload(view: MatchupView) {
  const pitchReference = useRef<HTMLDivElement>(null);
  const exportPitchReference = useRef<HTMLDivElement>(null);
  const listReference = useRef<HTMLDivElement>(null);
  const exportListReference = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    const node =
      view === "list"
        ? (exportListReference.current ?? listReference.current)
        : (exportPitchReference.current ?? pitchReference.current);
    if (!node) {
      return;
    }
    setBusy(true);
    try {
      // eslint-disable-next-line import-x/dynamic-import-chunkname -- el nombre de chunk obliga a un comentario dentro del import(), y eso choca con no-inline-comments
      const { toPng } = await import("html-to-image");
      // Con tope de tiempo: si una foto no llega a cargar, `toPng` se queda
      // esperando y el botón se quedaba en "Generando…" para siempre, sin
      // imagen y sin aviso. Rendirse y decirlo es mejor que no decir nada.
      const url = await Promise.race([
        toPng(node, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "#0a1330",
        }),
        rejectAfter(EXPORT_TIMEOUT_MS),
      ]);
      const a = document.createElement("a");
      a.href = url;
      // Nombre con fecha: la carpeta de descargas acababa con
      // "reta-vs (3).png" y no había forma de saber cuál era la de hoy.
      const today = new Date();
      a.download = `reta-${today.toISOString().slice(0, 10)}.png`;
      a.click();
      toast.success("Imagen generada 📸");
    } catch {
      toast.error("No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  }

  return {
    pitchRef: pitchReference,
    exportPitchRef: exportPitchReference,
    listRef: listReference,
    exportListRef: exportListReference,
    busy,
    download,
  };
}
