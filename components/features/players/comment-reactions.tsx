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
import { EmojiPicker } from "frimousse";
import { PlusIcon, SmilePlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
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

/** Set of `${commentId}:${emoji}` this browser has reacted with. */
function readMine(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(MINE_STORE) ?? "[]"));
  } catch {
    return new Set();
  }
}

export function CommentReactions({
  playerId,
  commentId,
  counts,
}: {
  playerId: number;
  commentId: number;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [mine, setMine] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  // Clicking the trigger pins the palette open so you can travel to an emoji
  // without the hover dropping — the gap between trigger and palette otherwise
  // closes it on desktop. Hover still opens it for quick discoverability.
  const [pinned, setPinned] = React.useState(false);

  // Read localStorage after mount to avoid SSR/client mismatch.
  React.useEffect(() => setMine(readMine()), []);

  const paletteOpen = pinned || hovered || pickerOpen;

  function closePalette() {
    setPinned(false);
    setHovered(false);
  }

  const distinctCount = Object.keys(counts).filter((e) => counts[e] > 0).length;

  async function react(emoji: string) {
    if (pending) return;
    // Client-side mirror of the server cap: block brand-new emojis past the max.
    if (!counts[emoji] && distinctCount >= MAX_DISTINCT_REACTIONS) {
      toast.error(
        `Máximo ${MAX_DISTINCT_REACTIONS} reacciones distintas por comentario.`,
      );
      return;
    }
    setPending(emoji);
    const res = await toggleCommentReaction(
      playerId,
      commentId,
      emoji,
      reactorKey(),
    );
    setPending(null);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const next = readMine();
    const id = `${commentId}:${emoji}`;
    if (res.reacted) next.add(id);
    else next.delete(id);
    localStorage.setItem(MINE_STORE, JSON.stringify([...next]));
    setMine(next);
    router.refresh();
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
            key={emoji}
            type="button"
            disabled={pending === emoji}
            onClick={() => react(emoji)}
            aria-pressed={isMine}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums transition-colors disabled:opacity-50",
              isMine
                ? "border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-400"
                : "border-border hover:bg-muted",
            )}
          >
            <span>{emoji}</span>
            <span>{counts[emoji]}</span>
          </button>
        );
      })}

      {/* Quick-react affordance: click to pin open, hover for discoverability. */}
      <div
        className="relative flex items-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onBlur={(e) => {
          // Focus left the whole cluster (and not into the portalled picker) →
          // collapse. Keeps the palette from lingering after a click-away.
          if (!e.currentTarget.contains(e.relatedTarget as Node) && !pickerOpen)
            closePalette();
        }}
      >
        <button
          type="button"
          aria-label="Reaccionar"
          aria-expanded={paletteOpen}
          onClick={() => (paletteOpen ? closePalette() : setPinned(true))}
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring inline-flex size-6 items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <SmilePlusIcon className="size-4" />
        </button>

        <div
          className={cn(
            // pt-1.5 (not mb) keeps the trigger→palette gap inside the hover
            // area so crossing it never drops the hover.
            "absolute bottom-full left-0 z-10 pb-1.5",
            "transition-[opacity,transform] duration-150",
            paletteOpen
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-95 opacity-0",
          )}
        >
          <div className="bg-popover flex items-center gap-0.5 rounded-full border p-1 shadow-md">
            {REACTION_EMOJIS.map((emoji) => {
              const isMine = mine.has(`${commentId}:${emoji}`);
              return (
                <button
                  key={emoji}
                  type="button"
                  disabled={pending === emoji}
                  onClick={() => react(emoji)}
                  aria-label={`Reaccionar ${emoji}`}
                  aria-pressed={isMine}
                  className={cn(
                    "rounded-full p-1 text-2xl transition-transform hover:scale-125 disabled:opacity-50",
                    isMine && "bg-amber-400/20",
                  )}
                >
                  {emoji}
                </button>
              );
            })}

            <span className="bg-border mx-0.5 h-5 w-px" />

            {/* + opens the full emoji picker. */}
            <Popover
              open={pickerOpen}
              onOpenChange={(o) => {
                setPickerOpen(o);
                if (!o) setHovered(false);
              }}
            >
              <PopoverTrigger
                aria-label="Más emojis"
                className="inline-flex items-center justify-center rounded-full transition-colors"
                render={<Button size="icon-lg" variant={"ghost"} />}
              >
                <PlusIcon />
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-fit gap-0 overflow-hidden p-0"
              >
                <EmojiPicker.Root
                  locale="es"
                  className="isolate flex h-80 w-72 flex-col bg-transparent"
                  onEmojiSelect={({ emoji }) => {
                    setPickerOpen(false);
                    react(emoji);
                  }}
                >
                  <EmojiPicker.Search
                    placeholder="Buscar emoji…"
                    className="bg-muted/60 focus-visible:ring-ring z-10 m-2 appearance-none rounded-full px-3 py-2 text-sm outline-none focus-visible:ring-2"
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
                      components={{
                        CategoryHeader: ({ category, ...props }) => (
                          <div
                            className="bg-popover text-muted-foreground px-3 pt-2.5 pb-1.5 text-xs font-medium"
                            {...props}
                          >
                            {category.label}
                          </div>
                        ),
                        Row: ({ children, ...props }) => (
                          <div className="scroll-my-1.5 px-1.5" {...props}>
                            {children}
                          </div>
                        ),
                        Emoji: ({ emoji, ...props }) => (
                          <button
                            className="data-[active]:bg-muted flex size-9 items-center justify-center rounded-md text-2xl"
                            title={emoji.label}
                            {...props}
                          >
                            {emoji.emoji}
                          </button>
                        ),
                      }}
                    />
                  </EmojiPicker.Viewport>
                </EmojiPicker.Root>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
