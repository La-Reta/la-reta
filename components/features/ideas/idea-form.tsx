"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LightbulbIcon } from "lucide-react";
import { createIdea } from "@/app/actions/ideas";
import { IDEA_CATEGORIES, IDEA_CATEGORY_LABEL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

const EMPTY = { title: "", description: "", author: "", category: "mejora" };

function collectClient() {
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

export function IdeaForm() {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [pending, startTransition] = React.useTransition();

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Pon un título y describe tu idea.");
      return;
    }
    startTransition(async () => {
      const res = await createIdea({ ...form, client: collectClient() });
      if (res.ok) {
        toast.success("¡Idea enviada! Gracias 🙌");
        setForm(EMPTY);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-card ring-foreground/10 space-y-4 rounded-lg p-4 ring-1"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs">Título</Label>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ej. Llevar conos para marcar la portería"
            maxLength={140}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <Label className="mb-1.5 block text-xs">Descripción</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Cuéntanos el detalle: qué propones y por qué ayudaría a la reta."
            rows={4}
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Categoría</Label>
          <NativeSelect
            className="w-full"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            {IDEA_CATEGORIES.map((c) => (
              <NativeSelectOption key={c} value={c}>
                {IDEA_CATEGORY_LABEL[c]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs">Tu nombre (opcional)</Label>
          <Input
            value={form.author}
            onChange={(e) => set("author", e.target.value)}
            placeholder="Anónimo"
            maxLength={60}
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        <LightbulbIcon />
        {pending ? "Enviando…" : "Enviar idea"}
      </Button>
    </form>
  );
}
