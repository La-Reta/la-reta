"use client";

import { unlockLive } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

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
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-sky-500/10 text-sky-500 ring-1 ring-sky-500/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20">
          <RadioIcon className="size-5" />
        </div>
        <CardTitle className="text-lg font-bold">Marcador en vivo</CardTitle>
        <CardDescription className="mt-1">
          Ingresa la contraseña del marcador para iniciar un partido. Así
          evitamos que se llene de partidos de relleno.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <Label className="mb-1.5 block">Contraseña</Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              autoFocus
              required
            />
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
