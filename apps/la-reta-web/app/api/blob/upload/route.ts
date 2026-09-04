import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

// Límite duro en el servidor: el token firmado solo permite subir hasta esto.
// El cliente ya comprime a ~300 KB; dejamos margen y cortamos en 500 KB.
const MAX_BYTES = 500 * 1024;
const ALLOWED_CONTENT_TYPES = ["image/webp"] as const;

/**
 * Route Handler para Client Uploads de Vercel Blob.
 *
 * Dos responsabilidades (las maneja `handleUpload`):
 *  1. `onBeforeGenerateToken`: se ejecuta ANTES de darle al navegador un token
 *     de subida. Aquí validamos la sesión y fijamos las restricciones (tipo,
 *     tamaño). La imagen NO pasa por este endpoint: el navegador sube directo a
 *     Blob con el token firmado.
 *  2. `onUploadCompleted`: callback servidor-a-servidor que Vercel invoca cuando
 *     la subida termina. Es el lugar correcto para persistir la URL en la BD.
 *
 * Por qué validar la sesión aquí: el token de subida da permiso de escritura al
 * Blob store. Si no exiges sesión, cualquiera puede pedir un token y llenar tu
 * almacenamiento (y tu factura). La validación vive en el servidor porque el
 * cliente es manipulable; nunca confíes en él.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, _clientPayload, _multipart) => {
        // 🔐 AUTENTICACIÓN — integra aquí Auth.js / Clerk / tu sesión propia.
        // Con Clerk basta `auth()`. Con Auth.js sería `await getServerSession()`.
        const { userId } = await auth();
        if (!userId) {
          // Bloquea subidas anónimas (crítico en producción).
          throw new UnauthorizedError(
            "Debes iniciar sesión para subir imágenes.",
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
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // ⚠️ Nota: en localhost este callback NO se dispara (Vercel no puede
        // alcanzar tu máquina). Pruébalo en un deploy o con un túnel (ngrok).
        const meta: { userId?: string } = tokenPayload
          ? (JSON.parse(tokenPayload) as { userId?: string })
          : {};

        // 💾 GUARDA LA URL EN TU BASE DE DATOS AQUÍ.
        // p.ej.: await db.insert(images).values({ url: blob.url, userId: meta.userId });
        void meta;
        void blob;
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof UnauthorizedError ? 401 : 400;
    const message = err instanceof Error ? err.message : "Error de subida.";
    return NextResponse.json({ error: message }, { status });
  }
}

/** Error tipado para distinguir 401 de un 400 genérico en el catch. */
class UnauthorizedError extends Error {}
