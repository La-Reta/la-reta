"use client";

import {
  addPlayerComment,
  archivePlayerComment,
  deleteOwnComment,
  type ClientInfo,
} from "@/app/actions/comments";
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

/** Read-only star row supporting fractional values (for the average). */
function Stars({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(1, value / 5)) * 100;
  return (
    <span
      className={cn("relative inline-flex w-fit", className)}
      role="img"
      aria-label={`${value.toFixed(1)} de 5 estrellas`}
    >
      <span className="text-muted-foreground/30 flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} className="size-4" />
        ))}
      </span>
      <span
        className="absolute inset-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${pct}%` }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <StarIcon key={i} className="size-4 shrink-0 fill-current" />
        ))}
      </span>
    </span>
  );
}

/** Interactive star picker. */
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
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
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Live count for the card title. Shares the `useComments` cache (same queryKey)
 * with the list, so header and list never diverge — no extra fetch.
 */
export function CommentsCount({
  playerId,
  initialData,
}: {
  playerId: number;
  initialData: {
    comments: PlayerComment[];
    reactions?: Record<number, Record<string, number>>;
  };
}) {
  const { data } = useComments(playerId, {
    comments: initialData.comments,
    reactions: initialData.reactions ?? {},
  });
  return <>{data.comments.length}</>;
}

export function PlayerComments({
  playerId,
  comments: initialComments,
  reactions: initialReactions = {},
  isAdmin = false,
}: {
  playerId: number;
  comments: PlayerComment[];
  reactions?: Record<number, Record<string, number>>;
  isAdmin?: boolean;
}) {
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

  const rated = comments.filter((c) => c.rating != null) as (PlayerComment & {
    rating: number;
  })[];
  const avg = rated.length
    ? rated.reduce((a, c) => a + c.rating, 0) / rated.length
    : 0;

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
          <p className="text-muted-foreground mt-1 text-[10px] uppercase">
            de 5
          </p>
        </div>
        <div className="space-y-1">
          {rated.length ? (
            <Stars value={avg} className="[&_svg]:size-5" />
          ) : null}
          <p className="text-muted-foreground text-xs">
            {rated.length > 0
              ? `${rated.length} calificación${rated.length === 1 ? "" : "es"}`
              : "Sin calificaciones aún"}
            {comments.length > rated.length
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
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    {formatLongDate(c.createdAt)}
                    {isAdmin ? (
                      <Button
                        type="button"
                        onClick={() => onArchive(c.id)}
                        disabled={pending}
                        aria-label="Archivar comentario"
                        title="Archivar (ocultar sin eliminar)"
                        variant={"destructive"}
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
                        variant={"destructive"}
                      >
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    ) : null}
                  </span>
                </div>
                {c.rating != null && (
                  <Stars value={c.rating} className="mt-0.5" />
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
}
