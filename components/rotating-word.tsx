"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function nextRandom(current: number, len: number) {
  if (len <= 1) return current;
  let n = current;
  while (n === current) n = Math.floor(Math.random() * len);
  return n;
}

/**
 * Cycles through `words` at random, fading between them. Starts on words[0] so
 * the server and first client render match. Honors prefers-reduced-motion.
 */
export function RotatingWord({
  words,
  className,
  intervalMs = 2600,
}: {
  words: string[];
  className?: string;
  intervalMs?: number;
}) {
  const [index, setIndex] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const reduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let swap: ReturnType<typeof setTimeout>;
    const tick = setInterval(() => {
      if (reduce) {
        setIndex((i) => nextRandom(i, words.length));
        return;
      }
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => nextRandom(i, words.length));
        setVisible(true);
      }, 240);
    }, intervalMs);
    return () => {
      clearInterval(tick);
      clearTimeout(swap);
    };
  }, [words.length, intervalMs]);

  return (
    <span
      className={cn(
        "inline-block transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
        className,
      )}
    >
      {words[index]}
    </span>
  );
}
