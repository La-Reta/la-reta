import { GifLoader } from "@/components/loaders/gif-loader";
import { loaderGifs } from "@/components/loaders/loader-gifs";

// Root fallback: any route without its own loading.tsx uses this.
export default function Loading() {
  return (
    <GifLoader
      gifs={loaderGifs()}
      message="Cargando"
      sub="Preparando la reta…"
    />
  );
}
