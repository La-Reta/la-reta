"use client";

import { addRetaWord, type ClientInfo } from "@/app/actions/words";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SparklesIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

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

export function WordForm() {
  const router = useRouter();
  const [word, setWord] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const w = word.trim();
    if (!w) {
      toast.error("Escribe una palabra para completar la frase.");
      return;
    }
    startTransition(async () => {
      const res = await addRetaWord({
        word: w,
        author,
        client: collectClient(),
      });
      if (res.ok) {
        toast.success("¡Gracias! Tu palabra ya gira en el banner ⚽");
        setWord("");
        setAuthor("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="ring-foreground/10 overflow-hidden rounded-lg bg-[linear-gradient(135deg,#0b3d2e_0%,#0a3327_60%,#072018_100%)] p-6 text-white ring-1 md:p-8"
    >
      <p className="font-display text-center text-xs font-semibold tracking-[0.25em] text-emerald-300/80 uppercase">
        Completa la frase
      </p>

      {/* La Reta ____ */}
      <div className="font-display mt-3 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-4xl font-bold tracking-tight uppercase md:text-5xl">
        <span>La Reta</span>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          maxLength={40}
          placeholder="________"
          size={Math.max(word.length, 8)}
          aria-label="Tu palabra"
          autoFocus
          className="inline-block max-w-full border-b-4 border-emerald-400/70 bg-transparent text-center text-emerald-300 uppercase caret-emerald-300 placeholder:text-white/25 focus:border-emerald-400 focus:outline-none"
          required
        />
      </div>

      <p className="mx-auto mt-4 max-w-sm text-center text-sm text-emerald-50/70">
        Tu palabra se suma a las que rotan en el banner del inicio. Sé creativo
        — la verá toda la reta.
      </p>

      <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 text-left">
          <Label className="mb-1.5 block text-xs text-emerald-50/70">
            Tu nombre (opcional)
          </Label>
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Anónimo"
            maxLength={60}
            className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <Button
          type="submit"
          disabled={pending}
          className="h-9 bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
        >
          <SparklesIcon />
          {pending ? "Enviando…" : "Aportar palabra"}
        </Button>
      </div>
    </form>
  );
}
