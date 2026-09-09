"use client";

import { toggleCommentReaction } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MAX_DISTINCT_REACTIONS, REACTION_EMOJIS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { type CommentsData, commentsKey } from "@/hooks/use-comments";
import { useQueryClient } from "@tanstack/react-query";
import {
  EmojiPicker,
  type EmojiPickerListCategoryHeaderProps,
  type EmojiPickerListComponents,
  type EmojiPickerListEmojiProps,
  type EmojiPickerListRowProps,
} from "frimousse";
import { PlusIcon, SmilePlusIcon } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const KEY_STORE = "reta_reactor";
const MINE_STORE = "reta_reactions";

/** Stable anonymous id for this browser, created on first reaction. */
function reactorKey(): string {
  let k = localStorage.getItem(KEY_STORE);
  if (!k) {
    k = crypto.randomUUID();
    localStorage.setItem(KEY_STORE, k);
  }
  return k;
}

/**
 * Las piezas de la lista del selector, a nivel de módulo.
 *
 * Definirlas dentro del componente creaba un tipo nuevo en cada render, así que
 * React desmontaba y volvía a montar la lista entera —y con ella su scroll— en
 * cuanto cambiaba cualquier estado de arriba. Ninguna necesita nada del
 * componente padre, así que sacarlas fuera es gratis.
 */
const PICKER_COMPONENTS: Partial<EmojiPickerListComponents> = {
  CategoryHeader: ({
    category,
    ...props
  }: EmojiPickerListCategoryHeaderProps) => (
    <div
      className="bg-popover text-muted-foreground px-3 pt-2.5 pb-1.5 text-xs font-medium"
      {...props}
    >
      {category.label}
    </div>
  ),
  Row: ({ children, ...props }: EmojiPickerListRowProps) => (
    <div className="scroll-my-1.5 px-1.5" {...props}>
      {children}
    </div>
  ),
  Emoji: ({ emoji, ...props }: EmojiPickerListEmojiProps) => (
    <button
      className="data-[active]:bg-muted flex size-9 items-center justify-center rounded-md text-2xl"
      title={emoji.label}
      type="button"
      {...props}
    >
      {emoji.emoji}
    </button>
  ),
};

/** Set of `${commentId}:${emoji}` this browser has reacted with. */
function readMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE_STORE) ?? "[]"));
  } catch {
    return new Set();
  }
}

function writeMine(mine: Set<string>) {
  // La clave se queda sin versionar a propósito: versionarla tira las
  // reacciones que cada navegador ya tiene guardadas, y lo que hay dentro es
  // una lista de cadenas `id:emoji` que no va a cambiar de forma. Si algún día
  // cambia, se versiona **y** se migra, como se hizo con el marcador en vivo.
  // eslint-disable-next-line react-doctor/client-localstorage-no-version -- ver arriba
  localStorage.setItem(MINE_STORE, JSON.stringify([...mine]));
}

/** Las mismas cuentas con `emoji` sumado o restado en un comentario. */
function withDelta(
  prev: CommentsData | undefined,
  commentId: number,
  emoji: string,
  delta: number
): CommentsData | undefined {
  if (!prev) return prev;
  const forComment = prev.reactions[commentId] ?? {};
  const next = Math.max(0, (forComment[emoji] ?? 0) + delta);
  return {
    ...prev,
    reactions: {
      ...prev.reactions,
      [commentId]: { ...forComment, [emoji]: next },
    },
  };
}

export const CommentReactions = ({
  playerId,
  commentId,
  counts,
}: {
  readonly playerId: number;
  readonly commentId: number;
  readonly counts: Record<string, number>;
}) => {
  /**
   * El optimismo se escribe en la caché de TanStack Query, que es de donde
   * salen estas `counts`.
   *
   * Dos intentos anteriores fallaron por no mirar de dónde venía el dato:
   *
   * 1. Esperar a la server action movía el número casi dos segundos después.
   * 2. `useOptimistic` + `router.refresh()` lo pintaba y lo borraba enseguida.
   *    `useOptimistic` solo sostiene su valor mientras la transición sigue
   *    pendiente, y `router.refresh()` no se puede esperar —devuelve `void`—,
   *    así que la transición terminaba de inmediato y el chip desaparecía. Y
   *    el refresh tampoco servía de nada: `PlayerComments` lee las reacciones
   *    de `useComments`, y las props del servidor solo son su `initialData`,
   *    que se ignora una vez que la query tiene datos. La cuenta de verdad no
   *    llegaba hasta el sondeo de 15 s.
   *
   * Escribir en la caché no caduca con ninguna transición, y `invalidateQueries`
   * reconcilia con el servidor por la misma vía por la que el componente lee.
   */
  const queryClient = useQueryClient();
  const queryKey = commentsKey(playerId);

  const [mine, setMine] = React.useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = React.useState(false);
  // Paleta rápida como Popover: posicionamiento consciente de colisión (no se
  // recorta en móvil) y cierre al tocar fuera, gratis desde Base UI.
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Read localStorage after mount to avoid SSR/client mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  React.useEffect(() => setMine(readMine()), []);

  const distinctCount = Object.keys(counts).filter((e) => counts[e] > 0).length;

  function react(emoji: string) {
    const id = `${commentId}:${emoji}`;
    const wasMine = mine.has(id);

    // Client-side mirror of the server cap: block brand-new emojis past the max.
    if (
      !(wasMine || counts[emoji]) &&
      distinctCount >= MAX_DISTINCT_REACTIONS
    ) {
      toast.error(
        `Máximo ${MAX_DISTINCT_REACTIONS} reacciones distintas por comentario.`
      );
      return;
    }

    const delta = wasMine ? -1 : 1;

    // Todo lo visible se mueve ya: la cuenta en la caché y si la reacción es
    // mía. Ninguna de las dos depende de que el servidor conteste.
    const optimisticMine = new Set(mine);
    if (wasMine) optimisticMine.delete(id);
    else optimisticMine.add(id);
    setMine(optimisticMine);
    writeMine(optimisticMine);
    setPaletteOpen(false);
    queryClient.setQueryData<CommentsData>(queryKey, (prev) =>
      withDelta(prev, commentId, emoji, delta)
    );

    void (async () => {
      const res = await toggleCommentReaction({
        commentId,
        emoji,
        playerId,
        reactorKey: reactorKey(),
      });
      if (!res.ok) {
        setMine(mine);
        writeMine(mine);
        queryClient.setQueryData<CommentsData>(queryKey, (prev) =>
          withDelta(prev, commentId, emoji, -delta)
        );
        toast.error(res.error);
        return;
      }
      // Manda lo que diga el servidor, no el toggle local: otra pestaña pudo
      // haber dejado la reacción en el estado contrario con la misma clave.
      const confirmed = new Set(optimisticMine);
      if (res.reacted) confirmed.add(id);
      else confirmed.delete(id);
      setMine(confirmed);
      writeMine(confirmed);
      // Trae la verdad del servidor (y las reacciones de los demás) por la
      // misma query que alimenta a este componente.
      await queryClient.invalidateQueries({ queryKey });
    })();
  }

  // Any emoji with reactions, quick set first then extras alphabetically.
  const active = Object.keys(counts)
    .filter((e) => counts[e] > 0)
    .sort((a, b) => {
      const ia = REACTION_EMOJIS.indexOf(a as (typeof REACTION_EMOJIS)[number]);
      const ib = REACTION_EMOJIS.indexOf(b as (typeof REACTION_EMOJIS)[number]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {active.map((emoji) => {
        const isMine = mine.has(`${commentId}:${emoji}`);
        return (
          <button
            aria-pressed={isMine}
            className={cn(
              // `h-8`: la píldora medía 22 px de alto y en el teléfono se
              // fallaba el toque tan a menudo que parecía que no respondía.
              "inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-sm tabular-nums",
              "transition-[background-color,border-color,scale] motion-safe:active:scale-95",
              isMine
                ? "border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-400"
                : "border-border hover:bg-muted"
            )}
            key={emoji}
            onClick={() => react(emoji)}
            type="button"
          >
            <span>{emoji}</span>
            <span>{counts[emoji]}</span>
          </button>
        );
      })}

      {/* Quick-react: click abre la paleta (Popover con colisión + click-fuera). */}
      <Popover onOpenChange={setPaletteOpen} open={paletteOpen}>
        <PopoverTrigger
          aria-label="Reaccionar"
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-8 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <SmilePlusIcon className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-fit max-w-[calc(100vw-1.5rem)] flex-row items-center gap-0.5 rounded-full p-1"
          side="top"
        >
          {REACTION_EMOJIS.map((emoji) => {
            const isMine = mine.has(`${commentId}:${emoji}`);
            return (
              <button
                aria-label={`Reaccionar ${emoji}`}
                aria-pressed={isMine}
                className={cn(
                  // 40 px de lado: el objetivo táctil real. Antes era el propio
                  // glifo con 4 px de aire, ~32 px, y en la banda con el pulgar
                  // se acertaba de casualidad.
                  // El `hover:scale` de antes no existe en una pantalla táctil
                  // —y en escritorio hacía que los vecinos bailaran—; el `active`
                  // sí responde al dedo. En Tailwind v4 `scale-*` emite la
                  // propiedad `scale`, así que la transición la nombra a ella.
                  "grid size-10 shrink-0 place-items-center rounded-full text-2xl",
                  "transition-[background-color,scale] motion-safe:active:scale-90",
                  isMine ? "bg-amber-400/20" : "hover:bg-muted"
                )}
                key={emoji}
                onClick={() => react(emoji)}
                type="button"
              >
                {emoji}
              </button>
            );
          })}

          <span className="bg-border mx-0.5 h-5 w-px" />

          {/* + opens the full emoji picker (Popover anidado). */}
          <Popover onOpenChange={setPickerOpen} open={pickerOpen}>
            <PopoverTrigger
              aria-label="Más emojis"
              // `size-10` a mano: el `+` tiene que medir lo mismo que los seis
              // emojis o la píldora queda con un botón hundido al final. El
              // tamaño `icon` del Button es 36 y no hay variante de 40.
              className="size-10 shrink-0 rounded-full"
              render={<Button size="icon" variant="ghost" />}
            >
              <PlusIcon />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-fit max-w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-0"
            >
              <EmojiPicker.Root
                className="isolate flex h-80 w-72 max-w-full flex-col bg-transparent"
                locale="es"
                onEmojiSelect={({ emoji }) => {
                  setPickerOpen(false);
                  react(emoji);
                }}
              >
                <EmojiPicker.Search
                  className="bg-muted/60 focus-visible:ring-ring z-10 m-2 appearance-none rounded-full px-3 py-2 text-sm outline-none focus-visible:ring-2"
                  placeholder="Buscar emoji…"
                />
                <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
                  <EmojiPicker.Loading className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                    Cargando…
                  </EmojiPicker.Loading>
                  <EmojiPicker.Empty className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
                    Sin resultados.
                  </EmojiPicker.Empty>
                  <EmojiPicker.List
                    className="pb-1.5 select-none"
                    components={PICKER_COMPONENTS}
                  />
                </EmojiPicker.Viewport>
              </EmojiPicker.Root>
            </PopoverContent>
          </Popover>
        </PopoverContent>
      </Popover>
    </div>
  );
};
