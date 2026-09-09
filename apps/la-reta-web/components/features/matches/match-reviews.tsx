"use client";

import {
  addMatchComment,
  deleteOwnMatchComment,
  editOwnMatchComment,
  toggleMatchCommentReaction,
} from "@/app/actions/match-comments";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StarRating } from "@/components/shared/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MAX_BODY, REACTION_EMOJIS } from "@/lib/constants";
import { formatLongDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  PencilIcon,
  SendIcon,
  StarIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

export type MatchReview = {
  id: number;
  author: string | null;
  authorImageUrl: string | null;
  body: string;
  rating: number | null;
  createdAt: string;
  mine: boolean;
  reactions: Record<string, number>;
  myReactions: string[];
};

const STARS = [1, 2, 3, 4, 5] as const;

/**
 * "La reta según ustedes": las reseñas de un partido.
 *
 * Mismas reglas que las de un jugador —sesión para escribir, solo tu propia
 * reseña se edita o se borra, tope de texto y de emojis distintos— pero otra
 * presentación, porque la pregunta es otra. En una ficha lo que importa es la
 * media de una persona a lo largo de meses; aquí importa **cómo se sintió una
 * tarde concreta**, y eso lo cuenta mejor el reparto de notas que el promedio:
 * un 3.0 de "todos pusieron 3" y un 3.0 de "mitad cincos, mitad unos" son dos
 * retas muy distintas, y en un número suelto se leen igual.
 */
export const MatchReviews = ({
  matchId,
  reviews,
  average,
  canReview,
}: {
  readonly matchId: number;
  readonly reviews: MatchReview[];
  readonly average: number | null;
  /** Hay sesión. Sin ella se lee todo, pero no se escribe ni se reacciona. */
  readonly canReview: boolean;
}) => {
  const rated = reviews.filter((r) => r.rating !== null).length;

  return (
    <section className="space-y-4">
      <ReviewsHeader average={average} reviews={reviews} votes={rated} />

      {canReview ? (
        <Composer matchId={matchId} />
      ) : (
        <Card size="sm">
          <CardContent className="text-muted-foreground text-sm">
            Inicia sesión para contar qué te pareció la reta.
          </CardContent>
        </Card>
      )}

      {reviews.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nadie ha dicho nada de esta reta todavía. Sé el primero.
        </p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((review) => (
            <li className="reveal-on-scroll" key={review.id}>
              <ReviewCard
                canReact={canReview}
                matchId={matchId}
                review={review}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * La cabecera: nota media grande y el reparto de las cinco notas.
 *
 * Las barras son el motivo de que esto no sea la cabecera de la ficha de un
 * jugador. Con seis reseñas de una tarde, ver que tres pusieron cinco y una
 * puso uno cuenta la discusión que hubo; la media sola la esconde.
 */
const ReviewsHeader = ({
  average,
  votes,
  reviews,
}: {
  readonly average: number | null;
  readonly votes: number;
  readonly reviews: MatchReview[];
}) => {
  const counts = STARS.map(
    (star) => reviews.filter((r) => r.rating === star).length
  );
  const top = Math.max(1, ...counts);

  if (average === null) {
    return null;
  }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:w-40">
          <p className="font-display text-5xl leading-none font-black tabular-nums">
            {average.toFixed(1)}
          </p>
          <StarRating value={average} />
          <p className="text-muted-foreground text-xs">
            {votes} {votes === 1 ? "nota" : "notas"}
          </p>
        </div>

        {/* De 5 a 1, como cualquier reparto de reseñas: la vista empieza por lo
            bueno y baja. */}
        <div className="min-w-0 flex-1 space-y-1.5">
          {[...STARS].reverse().map((star) => {
            const n = counts[star - 1] ?? 0;
            return (
              <div className="flex items-center gap-2" key={star}>
                <span className="text-muted-foreground w-6 shrink-0 text-right font-mono text-xs tabular-nums">
                  {star}
                </span>
                <StarIcon className="size-3 shrink-0 fill-amber-400 text-amber-400" />
                <span
                  aria-hidden="true"
                  className="bg-muted h-2 min-w-0 flex-1 overflow-hidden rounded-full"
                >
                  <span
                    className="block h-full rounded-full bg-amber-400 transition-[width] duration-500"
                    style={{ width: `${(n / top) * 100}%` }}
                  />
                </span>
                <span className="text-muted-foreground w-6 shrink-0 font-mono text-xs tabular-nums">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

/** Las cinco estrellas pulsables. `0` = sin nota, que es válido. */
const StarInput = ({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (value: number) => void;
}) => (
  // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
  <div aria-label="Tu nota" className="flex items-center gap-0.5" role="group">
    {STARS.map((star) => (
      <button
        aria-label={`${star} de 5`}
        aria-pressed={value >= star}
        className="focus-visible:ring-ring rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none"
        key={star}
        // Tocar la estrella que ya estaba quita la nota: sin esto, poner una
        // por error no se puede deshacer sin recargar.
        onClick={() => onChange(value === star ? 0 : star)}
        type="button"
      >
        <StarIcon
          className={cn(
            "size-6 transition-colors",
            value >= star
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          )}
        />
      </button>
    ))}
  </div>
);

/** Metadatos del navegador que se guardan con la reseña, como en la ficha. */
function collectClient() {
  if (typeof navigator === "undefined") {
    return {};
  }
  return {
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}`,
    platform: navigator.platform,
    userAgent: navigator.userAgent,
  };
}

const Composer = ({ matchId }: { readonly matchId: number }) => {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const result = await addMatchComment(matchId, {
        body,
        rating,
        client: collectClient(),
      });
      if (result.ok) {
        setBody("");
        setRating(0);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  const left = MAX_BODY - body.length;

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StarInput onChange={setRating} value={rating} />
          <span className="text-muted-foreground text-xs">
            La nota es opcional
          </span>
        </div>

        <Textarea
          maxLength={MAX_BODY}
          onChange={(e) => setBody(e.target.value)}
          placeholder="¿Cómo estuvo la reta? El nivel, el ambiente, la cancha…"
          rows={3}
          value={body}
        />

        <div className="flex items-center justify-between gap-3">
          <span
            className={cn(
              "font-mono text-xs tabular-nums",
              left < 50 ? "text-destructive" : "text-muted-foreground"
            )}
          >
            {left}
          </span>
          <Button
            disabled={pending || body.trim() === ""}
            onClick={submit}
            type="button"
          >
            <SendIcon />
            Publicar
          </Button>
        </div>

        {error === null ? null : (
          <p className="text-destructive text-sm">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};

const ReviewCard = ({
  matchId,
  review,
  canReact,
}: {
  readonly matchId: number;
  readonly review: MatchReview;
  readonly canReact: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const initials = (review.author ?? "?").slice(0, 2).toUpperCase();

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={review.authorImageUrl ?? undefined} width={72} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="truncate text-sm font-semibold">
                {review.author ?? "Anónimo"}
              </p>
              <time
                className="text-muted-foreground text-xs"
                dateTime={review.createdAt}
              >
                {formatLongDate(review.createdAt)}
              </time>
            </div>
            {review.rating === null ? null : (
              <StarRating className="mt-0.5" value={review.rating} />
            )}
          </div>

          {review.mine && !editing ? (
            <OwnerActions
              matchId={matchId}
              onEdit={() => setEditing(true)}
              reviewId={review.id}
            />
          ) : null}
        </div>

        {editing ? (
          <Editor
            initialBody={review.body}
            initialRating={review.rating ?? 0}
            key={`${review.id}-${review.body}`}
            matchId={matchId}
            onDone={() => setEditing(false)}
            reviewId={review.id}
          />
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {review.body}
          </p>
        )}

        <Reactions
          canReact={canReact}
          commentId={review.id}
          matchId={matchId}
          mine={review.myReactions}
          reactions={review.reactions}
        />
      </CardContent>
    </Card>
  );
};

const OwnerActions = ({
  matchId,
  reviewId,
  onEdit,
}: {
  readonly matchId: number;
  readonly reviewId: number;
  readonly onEdit: () => void;
}) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button onClick={onEdit} size="icon-sm" type="button" variant="ghost">
        <PencilIcon />
        <span className="sr-only">Editar mi reseña</span>
      </Button>
      <ConfirmDialog
        description="Se quita de la lista y no se puede deshacer."
        onConfirm={() =>
          startTransition(async () => {
            await deleteOwnMatchComment(matchId, reviewId);
            router.refresh();
          })
        }
        pending={pending}
        title="¿Borrar tu reseña?"
        trigger={
          <Button size="icon-sm" type="button" variant="ghost">
            <Trash2Icon />
            <span className="sr-only">Borrar mi reseña</span>
          </Button>
        }
      />
    </div>
  );
};

/**
 * El formulario de edición se monta con `key` desde la tarjeta, así que su
 * estado nace del texto actual en vez de copiarlo de un prop que puede cambiar
 * debajo. Copiarlo con `useState` dejaba lo escrito por otra pestaña sin verse.
 */
const Editor = ({
  matchId,
  reviewId,
  initialBody,
  initialRating,
  onDone,
}: {
  readonly matchId: number;
  readonly reviewId: number;
  readonly initialBody: string;
  readonly initialRating: number;
  readonly onDone: () => void;
}) => {
  const [body, setBody] = useState(initialBody);
  const [rating, setRating] = useState(initialRating);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <StarInput onChange={setRating} value={rating} />
      <Textarea
        maxLength={MAX_BODY}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        value={body}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone} size="sm" type="button" variant="ghost">
          <XIcon />
          Cancelar
        </Button>
        <Button
          disabled={pending || body.trim() === ""}
          onClick={() =>
            startTransition(async () => {
              await editOwnMatchComment(matchId, reviewId, { body, rating });
              onDone();
              router.refresh();
            })
          }
          size="sm"
          type="button"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
};

/**
 * Las reacciones se pintan optimistas: el contador salta al tocar y el servidor
 * confirma después. Es el patrón que documenta `comment-reactions.tsx` de la
 * ficha, y por el mismo motivo — la acción tarda ~1.2 s y el `router.refresh()`
 * de detrás otro tanto, porque vuelve a renderizar la página entera para mover
 * un número. `addOptimistic` va **dentro** del `startTransition` que envuelve
 * al `await`, o el valor optimista se suelta antes de tiempo.
 */
const Reactions = ({
  matchId,
  commentId,
  reactions,
  mine,
  canReact,
}: {
  readonly matchId: number;
  readonly commentId: number;
  readonly reactions: Record<string, number>;
  readonly mine: string[];
  readonly canReact: boolean;
}) => {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [state, addOptimistic] = useOptimistic(
    { reactions, mine },
    (
      current: { reactions: Record<string, number>; mine: string[] },
      emoji: string
    ) => {
      const has = current.mine.includes(emoji);
      const next = { ...current.reactions };
      next[emoji] = Math.max(0, (next[emoji] ?? 0) + (has ? -1 : 1));
      return {
        reactions: next,
        mine: has
          ? current.mine.filter((e) => e !== emoji)
          : [...current.mine, emoji],
      };
    }
  );

  const toggle = (emoji: string) => {
    startTransition(async () => {
      addOptimistic(emoji);
      await toggleMatchCommentReaction({
        matchId,
        commentId,
        emoji,
      });
      router.refresh();
    });
  };

  // Los emojis de la paleta siempre, más los que alguien ya usó fuera de ella.
  const palette = new Set<string>(REACTION_EMOJIS);
  const shown = [
    ...REACTION_EMOJIS,
    ...Object.keys(state.reactions).filter((e) => !palette.has(e)),
  ];
  const on = new Set(state.mine);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((emoji) => {
        const count = state.reactions[emoji] ?? 0;
        // Sin sesión solo se enseñan las que ya tienen cuenta: una fila de
        // emojis en cero que además no se pueden tocar es ruido.
        if (!canReact && count === 0) {
          return null;
        }
        return (
          <button
            aria-pressed={on.has(emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors",
              on.has(emoji)
                ? "border-primary/40 bg-primary/10"
                : "bg-muted hover:bg-muted/70 border-transparent",
              count === 0 && "opacity-50",
              !canReact && "pointer-events-none"
            )}
            disabled={!canReact || pending}
            key={emoji}
            onClick={() => toggle(emoji)}
            type="button"
          >
            <span aria-hidden="true">{emoji}</span>
            {count > 0 ? (
              <span className="font-mono text-xs tabular-nums">{count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
