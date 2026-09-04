"use server";

import { put } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import { toWebp, webpName } from "@/lib/images";

type Result = { ok: true; url: string } | { ok: false; error: string };

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB — foto de celular cabe de sobra.

/**
 * Sube una imagen a Vercel Blob (público) y devuelve la URL para guardar en
 * `photoUrl`. Antes de guardarla la pasa por `toWebp`, así que en el store
 * siempre queda WebP acotado a 1600 px, venga de donde venga y sin deformarse.
 * Requiere `BLOB_READ_WRITE_TOKEN` (se inyecta al conectar un Blob store al
 * proyecto en Vercel; en local corre `vercel env pull`).
 */
export async function uploadImage(formData: FormData): Promise<Result> {
  const { userId } = await auth();
  if (!userId && !(await isAdmin()))
    return { ok: false, error: "Inicia sesión o entra como admin para subir." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No se recibió ningún archivo." };
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "Solo se permiten imágenes." };
  if (file.size > MAX_BYTES)
    return { ok: false, error: "La imagen supera los 6 MB." };

  try {
    const image = await toWebp(await file.arrayBuffer());
    // addRandomSuffix evita colisiones de nombre (put falla si ya existe).
    const blob = await put(`players/${webpName(file.name)}`, image.data, {
      access: "public",
      addRandomSuffix: true,
      contentType: image.contentType,
    });
    return { ok: true, url: blob.url };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
