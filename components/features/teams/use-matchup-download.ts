"use client";

import * as React from "react";
import { toast } from "sonner";
import type { MatchupView } from "@/components/features/teams/control-bar";

/**
 * Refs + acción para exportar el matchup como PNG. Se prefiere la copia oculta
 * (a tamaño desktop) sobre la visible, así la descarga desde mobile respeta el
 * tamaño completo. html-to-image se importa de forma perezosa.
 */
export function useMatchupDownload(view: MatchupView) {
  const pitchRef = React.useRef<HTMLDivElement>(null);
  const exportPitchRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const exportListRef = React.useRef<HTMLDivElement>(null);
  const [busy, setBusy] = React.useState(false);

  async function download() {
    const node =
      view === "list"
        ? (exportListRef.current ?? listRef.current)
        : (exportPitchRef.current ?? pitchRef.current);
    if (!node) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#0a1330",
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = "reta-vs.png";
      a.click();
      toast.success("Imagen generada 📸");
    } catch {
      toast.error("No se pudo generar la imagen");
    } finally {
      setBusy(false);
    }
  }

  return { pitchRef, exportPitchRef, listRef, exportListRef, busy, download };
}
