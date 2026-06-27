"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LockIcon } from "lucide-react";
import { loginAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin() {
  const router = useRouter();
  const [pin, setPin] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAdmin(pin);
      if (res.ok) {
        toast.success("Acceso concedido");
        router.refresh();
      } else {
        toast.error(res.error);
        setPin("");
      }
    });
  }

  return (
    <div className="mx-auto max-w-sm py-12">
      <div className="bg-card p-6 rounded-lg ring-1 ring-foreground/10">
        <div className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <LockIcon className="size-5" />
        </div>
        <h1 className="text-lg font-bold">Zona de administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa el PIN para gestionar ideas y la reta.
        </p>
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div>
            <Label className="mb-1.5 block text-xs">PIN</Label>
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Verificando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
