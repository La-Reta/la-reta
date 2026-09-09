import { auth } from "@clerk/nextjs/server";
import { handleUpload } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import type { HandleUploadBody } from "@vercel/blob/client";
import { isAdmin } from "@/lib/admin";

// Límite duro en el servidor: el token firmado solo permite subir hasta esto.
// El cliente ya comprime a ~300 KB; dejamos margen y cortamos en 500 KB.
const MAX_BYTES = 500 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/webp"] as const;

/**
 * Error tipado para distinguir un 401 de un 400 genérico en el catch.
 */
class UnauthorizedError extends Error {
  name = "UnauthorizedError";
}

/**
 * Route Handler para Client Uploads de Vercel Blob.
 *
 * Dos responsabilidades (las maneja `handleUpload`):
 *  1. `onBeforeGenerateToken`: corre ANTES de darle al navegador un token de
 *     subida. Aquí se valida la sesión y se fijan las restricciones (tipo,
 *     tamaño). La imagen NO pasa por este endpoint: el navegador sube directo a
 *     Blob con el token firmado.
 *
 * No hay `onUploadCompleted`: es opcional y aquí no hay nada que persistir —la
 * URL la guarda el formulario que la recibe—. Además en localhost no se dispara
 * (Vercel no alcanza tu máquina), así que colgar de él algo necesario deja un
 * fallo que solo aparece en un deploy.
 *
 * Por qué se valida la sesión aquí: el token da permiso de escritura al store.
 * Sin ese gate, cualquiera pide un token y llena el almacenamiento (y la
 * factura). Vive en el servidor porque el cliente es manipulable.
 */
// eslint-disable-next-line sonarjs/function-name -- el App Router exige que el handler se llame POST
export async function POST(request: Request): Promise<NextResponse> {
  // JSON que llega de fuera: `handleUpload` valida su forma y la firma del
  // token, que es lo único en lo que se puede confiar.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- ver arriba
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // El PIN cuenta como sesión: al alta de jugador se llega también con la
        // cookie de admin y sin cuenta de Clerk, y exigir solo `userId` dejaba a
        // ese admin sin poder subir la foto. Es la misma regla que aplica
        // `uploadImage` (`app/actions/uploads.ts`), y se comprueba en el
        // servidor —cookie de admin o token firmado—, no en el cliente.
        const { userId } = await auth();
        if (userId === null && !(await isAdmin())) {
          throw new UnauthorizedError(
            "Debes iniciar sesión o entrar como admin para subir imágenes."
          );
        }

        return {
          allowedContentTypes: [...ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          // Viaja firmado dentro del token y regresa en onUploadCompleted.
          tokenPayload: JSON.stringify({ userId }),
        };
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof UnauthorizedError ? 401 : 400;
    const message = Error.isError(error) ? error.message : "Error de subida.";
    return NextResponse.json({ error: message }, { status });
  }
}
