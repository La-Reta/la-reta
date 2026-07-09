import { GifLoader } from "@/components/loaders/gif-loader";
import { loaderGifs } from "@/components/loaders/loader-gifs";

export default function Loading() {
  return (
    <GifLoader
      gifs={loaderGifs()}
      message="Cargando la plantilla"
      sub="Preparando las cartas FIFA…"
    />
  );
}
