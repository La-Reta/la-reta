"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RadioIcon } from "lucide-react";
import { unlockLive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LiveLock() {
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await unlockLive(pin);
      if (res.ok) {
        toast.success("Acceso concedido 🎙️");
        router.refresh();
      } else {
        toast.error(res.error);
        setPin("");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="ring-foreground/10 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#11337a_0%,#0c1f4a_55%,#0a1330_100%)] p-6 text-white ring-1">
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-white/10 text-sky-300 ring-1 ring-white/15">
          <RadioIcon className="size-5" />
        </div>
        <h1 className="text-lg font-bold">Marcador en vivo</h1>
        <p className="mt-1 text-sm text-white/70">
          Ingresa la contraseña del marcador para iniciar un partido. Así
          evitamos que se llene de partidos de relleno.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs text-white/70">
              Contraseña
            </Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              autoFocus
              className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Button
            type="submit"
            disabled={pending}
            className="w-full bg-sky-500 text-sky-950 hover:bg-sky-400"
          >
            {pending ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
