"use client";

import { ImageUploader } from "@/components/ImageUploader";
import Image from "next/image";
import * as React from "react";

// Demo de integración del ImageUploader. La URL subida se muestra con next/image
// (el host de Blob ya está permitido en next.config.ts → images.remotePatterns).
export default function UploaderDemoPage() {
  const [url, setUrl] = React.useState<string | null>(null);

  return (
    <main className="mx-auto max-w-xl space-y-8 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Subida optimizada de imágenes</h1>
        <p className="text-sm text-neutral-500">
          Se comprime a WebP en el navegador y sube directo a Vercel Blob.
        </p>
      </div>

      <ImageUploader onUploadComplete={setUrl} maxSizeMB={0.3} />

      {url ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Imagen almacenada (next/image)</h2>
          <Image
            src={url}
            alt="Imagen subida"
            width={800}
            height={800}
            className="h-auto w-full rounded-lg border"
          />
        </section>
      ) : null}
    </main>
  );
}
