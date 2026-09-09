"use client";

import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/components/motion/gsap";
import { FifaCard } from "@/components/shared/fifa-card";
import { Checkbox } from "@/components/ui/checkbox";
import type { Player } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import Link from "next/link";
import * as React from "react";

/** Ancho real al que se pinta cada carta en cada breakpoint de la rejilla. */
const CARD_SIZES =
  "(min-width: 1536px) 17vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

/**
 * La rejilla de cartas y su entrada.
 *
 * Vive fuera de `PlayersBrowser` por lo mismo que la barra de filtros: el
 * componente de arriba lleva el estado (filtros, selección, borrado) y ya era
 * largo de leer. Aquí solo se pinta lo que llega por props.
 */
export const PlayerGrid = ({
  players,
  selected,
  onToggle,
}: {
  readonly players: Player[];
  readonly selected: Set<number>;
  readonly onToggle: (id: number) => void;
}) => {
  const gridRef = React.useRef<HTMLDivElement>(null);

  /**
   * La entrada, una sola vez y solo al montar.
   *
   * Este componente monta cuando el `<Suspense>` de la página releva al
   * esqueleto, así que el montaje **es** el instante en que llegan los datos:
   * animarlo aquí es lo que hace que el relevo se lea como "ya están" en vez de
   * como un parpadeo. Filtrar no vuelve a dispararlo (`useGSAP` sin
   * dependencias): reanimar la plantilla entera en cada tecla del buscador
   * sería mareante además de caro.
   *
   * **`set` y luego `to`, y no un `from` con `stagger`.** Un `from` escalonado
   * solo aplica el estado inicial a la primera carta; las demás se quedan
   * visibles hasta que les llega el turno y entonces saltan a invisible para
   * empezar a aparecer. Comprobado en el navegador: de diez cartas sobre el
   * pliegue, solo la primera tenía `opacity: 0` al montar. El `set` las escribe
   * todas de una vez dentro del efecto de layout, o sea antes de pintar.
   *
   * Tres decisiones que son de rendimiento, no de gusto:
   *
   * 1. **Un tween con `stagger`**, no uno por carta. Son ~20 cartas hoy y
   *    crecen con la reta; un tween por carta —o un componente de Motion por
   *    carta, con su propio ciclo— es trabajo que no hace falta para el mismo
   *    efecto.
   * 2. **Solo las que se ven.** Las de más abajo entran ya puestas: animar
   *    fuera de pantalla cuesta compositor y no lo mira nadie. Las medidas se
   *    leen todas seguidas y sin escribir nada entre medias, para que el
   *    navegador calcule el layout una vez en lugar de una por carta.
   * 3. **Ni `will-change` ni escalas.** Solo `y` y opacidad, que resuelve el
   *    compositor. Marcar cada carta con `will-change` crearía una capa por
   *    carta en memoria para 700 ms de animación: es el consejo de GSAP al
   *    revés.
   *
   * La duración y la curva no se declaran: ya son las de la casa
   * (`components/motion/gsap.ts`).
   */
  useGSAP(
    () => {
      gsap.matchMedia().add(NO_REDUCED_MOTION, () => {
        const cards = gsap.utils.toArray<HTMLElement>(".player-card");
        const fold = window.innerHeight;
        const onScreen = cards.filter(
          (card) => card.getBoundingClientRect().top < fold
        );
        gsap.set(onScreen, { autoAlpha: 0, y: 14 });
        gsap.to(onScreen, {
          autoAlpha: 1,
          y: 0,
          // `amount` y no `each`: reparte un total fijo entre las que haya. Con
          // `each` la entrada duraría lo que dure la plantilla y se alargaría
          // sola cada vez que entra alguien nuevo a la reta.
          stagger: { amount: 0.28 },
          // La animación no deja rastro: sin esto las cartas se quedan con
          // `opacity`, `visibility` y un `transform` inline para el resto de la
          // sesión —las que entraron animadas compuestas distinto que las de
          // abajo, y cualquier CSS posterior perdiendo contra un estilo inline.
          clearProps: "opacity,visibility,transform",
        });
      });
    },
    { scope: gridRef }
  );

  return (
    <div
      className="3xl:grid-cols-7 4xl:grid-cols-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
      ref={gridRef}
    >
      {players.map((player) => {
        const isSel = selected.has(player.id);
        return (
          // `player-card` es el gancho de la entrada de arriba: si se renombra,
          // la animación deja de encontrar nada y no avisa de nada.
          <div className="player-card group relative" key={player.id}>
            {/* Selection checkbox — only on hover (or when already selected) */}
            <label
              aria-label={`Seleccionar ${player.name}`}
              className={cn(
                "bg-background/85 ring-foreground/10 absolute top-2 left-2 z-10 flex cursor-pointer items-center justify-center rounded-md p-1 shadow ring-1 backdrop-blur transition-opacity",
                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
                isSel && "opacity-100"
              )}
            >
              <Checkbox
                checked={isSel}
                onCheckedChange={() => onToggle(player.id)}
              />
            </label>
            <Link
              className={cn(
                "block rounded-xl transition-transform duration-200 hover:-translate-y-1",
                // El foco de teclado necesita un anillo visible: el
                // desplazamiento solo no se percibe al tabular.
                "focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:-translate-y-1 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                isSel &&
                  "ring-primary ring-offset-background ring-2 ring-offset-2"
              )}
              href={`/players/${player.id}`}
              // Marca la dirección: la ficha entra deslizándose desde la
              // derecha y la rejilla sale hacia la izquierda.
              transitionTypes={["nav-forward"]}
            >
              <FifaCard
                className="card-shine"
                player={player}
                sizes={CARD_SIZES}
              />
            </Link>
          </div>
        );
      })}
    </div>
  );
};
