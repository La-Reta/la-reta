import { API_URL } from "@/lib/api";

/**
 * Resuelve una foto —de jugador o de partido— a una URL que el móvil pueda
 * pedir.
 *
 * `photoUrl` llega de dos sitios distintos: las subidas nuevas son absolutas
 * (Vercel Blob) y las viejas son rutas del `public/` de la web ("/players/99.webp").
 * En un navegador las relativas funcionan solas porque comparten origen; aquí no
 * hay origen, así que hay que pegarles el del backend o la imagen no carga nunca.
 */
export function photoSource(photoUrl: string | null): string | null {
  if (!photoUrl) return null;
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }

  return `${API_URL}${photoUrl.startsWith("/") ? "" : "/"}${photoUrl}`;
}

/** "Chato Bermúdez" → "CB". Lo que se enseña cuando no hay foto. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";

  // Con un solo nombre se toman dos letras suyas: una sola inicial en un
  // círculo de 54 px se ve como un error de carga, no como un retrato.
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}
