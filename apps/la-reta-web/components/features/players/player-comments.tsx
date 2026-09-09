"use client";

import {
  addPlayerComment,
  archivePlayerComment,
  deleteOwnComment,
  type ClientInfo,
} from "@/app/actions/comments";
import { StarRating } from "@/components/shared/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/use-comments";
import { formatLongDate } from "@/lib/dates";
import type { PlayerComment } from "@/lib/db/schema";
import { initials } from "@/lib/format";
import { cleanText } from "@/lib/profanity";
import { averageRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";
import { Show, SignInButton, useAuth } from "@clerk/nextjs";
import {
  ArchiveIcon,
  SendHorizonalIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { CommentReactions } from "./comment-reactions";

function collectClient(): ClientInfo {
  if (typeof navigator === "undefined") return {};
  const uaData = (
    navigator as unknown as { userAgentData?: { platform?: string } }
  ).userAgentData;
  return {
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen:
      typeof screen !== "undefined"
        ? `${screen.width}x${screen.height}`
        : undefined,
    platform: uaData?.platform ?? navigator.platform,
    userAgent: navigator.userAgent,
  };
}

/**
 * Default estable de `reactions`. Un `{}` en la firma es un objeto nuevo en
 * cada render, y `useComments` lo recibe como `initialData`.
 */
const NO_REACTIONS: Record<number, Record<string, number>> = {};

/** Interactive star picker. */
const StarInput = ({
  value,
  onChange,
}: {
  readonly value: number;
  readonly onChange: (v: number) => void;
}) => {
  const [hover, setHover] = React.useState(0);
  const active = hover || value;
  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-label="Tu calificación"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          aria-label={`${n} estrella${n === 1 ? "" : "s"}`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? 0 : n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="focus-visible:ring-ring rounded-sm p-0.5 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:outline-none"
        >
          <StarIcon
            className={cn(
              "size-6 transition-colors",
              active >= n
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
};

/**
 * Live count for the card title. Shares the `useComments` cache (same queryKey)
 * with the list, so header and list never diverge — no extra fetch.
 */
export const CommentsCount = ({
  playerId,
  initialData,
}: {
  readonly playerId: number;
  readonly initialData: {
    comments: PlayerComment[];
    reactions?: Record<number, Record<string, number>>;
  };
}) => {
  const { data } = useComments(playerId, {
    comments: initialData.comments,
    reactions: initialData.reactions ?? {},
  });
  // Un `<span>` y no el número pelado: devolver un number hace que el lint deje
  // de ver esto como un componente (y Fast Refresh, con él). El fragmento que
  // había antes tampoco valía, por vacío.
  return <span>{data.comments.length}</span>;
};

export const PlayerComments = ({
  playerId,
  comments: initialComments,
  reactions: initialReactions = NO_REACTIONS,
  isAdmin = false,
}: {
  readonly playerId: number;
  readonly comments: PlayerComment[];
  readonly reactions?: Record<number, Record<string, number>>;
  readonly isAdmin?: boolean;
}) => {
  // Polled every 15s (see useComments) so reseñas from other clients appear here.
  const { data, refetch } = useComments(playerId, {
    comments: initialComments,
    reactions: initialReactions,
  });
  const comments = data.comments;
  const reactions = data.reactions;
  const { userId: myUserId } = useAuth();
  const [body, setBody] = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [pending, startTransition] = React.useTransition();

  // Mismo cálculo que la ficha del jugador: si divergieran, la nota bajo la
  // carta y la de esta cabecera dirían cosas distintas del mismo jugador.
  const summary = averageRating(comments);
  const avg = summary?.avg ?? 0;
  const ratedCount = summary?.count ?? 0;

  function onArchive(commentId: number) {
    startTransition(async () => {
      const res = await archivePlayerComment(playerId, commentId);
      if (res.ok) {
        toast.success("Comentario archivado.");
        refetch();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onDeleteOwn(commentId: number) {
    startTransition(async () => {
      const res = await deleteOwnComment(playerId, commentId);
      if (res.ok) {
        toast.success("Reseña eliminada.");
        refetch();
      } else {
        toast.error(res.error);
      }
    });
  }

  function onSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const b = body.trim();
    if (!b) {
      toast.error("Escribe un comentario.");
      return;
    }
    startTransition(async () => {
      const res = await addPlayerComment(playerId, {
        body: b,
        rating,
        client: collectClient(),
      });
      if (res.ok) {
        toast.success("¡Reseña publicada! 🙌");
        setBody("");
        setRating(0);
        refetch();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-muted/40 flex items-center gap-5 rounded-lg p-4">
        <div className="text-center">
          <p className="font-mono text-4xl leading-none font-black tabular-nums">
            {avg ? avg.toFixed(1) : "—"}
          </p>
          {/* Micro-etiqueta bajo la nota grande: subirla a 12 px la pone a
              competir con el "4.0" que acompaña, que es lo que hay que leer.
              No es texto de interfaz que nadie tenga que descifrar. */}
          {/* eslint-disable-next-line react-doctor/no-tiny-text -- ver arriba */}
          <p className="text-muted-foreground mt-1 text-[10px] uppercase">
            de 5
          </p>
        </div>
        <div className="space-y-1">
          {ratedCount ? (
            <StarRating value={avg} className="[&_svg]:size-5" />
          ) : null}
          <p className="text-muted-foreground text-xs">
            {ratedCount > 0
              ? `${ratedCount} calificación${ratedCount === 1 ? "" : "es"}`
              : "Sin calificaciones aún"}
            {comments.length > ratedCount
              ? ` · ${comments.length} comentario${comments.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
      </div>

      {/* Compose — solo con sesión de Clerk */}
      <Show when="signed-in">
        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-lg border border-dashed p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">Deja tu reseña</span>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            placeholder="¿Qué se mueve? Comparte tu opinión…"
            rows={3}
            maxLength={500}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <KbdGroup>
                <Kbd>Shift</Kbd>
                <span aria-hidden>+</span>
                <Kbd>Enter</Kbd>
              </KbdGroup>
              para enviar
            </span>
            <Button type="submit" disabled={pending}>
              <SendHorizonalIcon />
              {pending ? "Enviando…" : "Publicar"}
            </Button>
          </div>
        </form>
      </Show>
      <Show when="signed-out">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <Label
            htmlFor="comments-login-btn"
            className="text-muted-foreground text-sm"
          >
            Inicia sesión para dejar tu reseña.
          </Label>
          <SignInButton mode="modal">
            <Button id="comments-login-btn">Iniciar sesión</Button>
          </SignInButton>
        </div>
      </Show>

      {/* Reviews */}
      {comments.length === 0 ? (
        <p className="text-muted-foreground py-4 text-center text-sm">
          Aún no hay reseñas. ¡Sé el primero en opinar! ⚽
        </p>
      ) : (
        <ul className="divide-border divide-y">
          {[...comments].reverse().map((c) => (
            <li key={c.id} className="flex gap-3 py-4 first:pt-0">
              <Avatar className="size-9 shrink-0">
                {c.authorImageUrl ? (
                  <AvatarImage src={c.authorImageUrl} alt={c.author ?? ""} />
                ) : null}
                <AvatarFallback className="text-xs font-semibold">
                  {c.author ? initials(c.author) : "🙂"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                  <span className="text-sm font-semibold">
                    {c.author ?? "Anónimo"}
                  </span>
                  {/* eslint-disable-next-line react-doctor/no-tiny-text -- la fecha es metadato secundario de la reseña; a 12 px pesa lo mismo que el nombre del autor */}
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    {formatLongDate(c.createdAt)}
                    {isAdmin ? (
                      <Button
                        type="button"
                        onClick={() => onArchive(c.id)}
                        disabled={pending}
                        aria-label="Archivar comentario"
                        title="Archivar (ocultar sin eliminar)"
                        variant="destructive"
                      >
                        <ArchiveIcon className="size-3.5" />
                      </Button>
                    ) : myUserId && c.authorId === myUserId ? (
                      <Button
                        type="button"
                        onClick={() => onDeleteOwn(c.id)}
                        disabled={pending}
                        aria-label="Eliminar mi reseña"
                        title="Eliminar mi reseña"
                        variant="destructive"
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    ) : null}
                  </span>
                </div>
                {c.rating != null && (
                  <StarRating value={c.rating} className="mt-0.5" />
                )}
                <p className="mt-1.5 text-sm leading-relaxed wrap-break-word">
                  {cleanText(c.body)}
                </p>
                <CommentReactions
                  playerId={playerId}
                  commentId={c.id}
                  counts={reactions[c.id] ?? {}}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
