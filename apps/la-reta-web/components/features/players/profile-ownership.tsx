"use client";

import { claimPlayer, unlinkPlayer } from "@/app/actions/players";
import { Button } from "@/components/ui/button";
import { Unlink2Icon, UserCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

/** Self-claim an unclaimed profile to the signed-in account. */
export function ClaimProfileButton({ playerId }: { playerId: number }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await claimPlayer(playerId);
          if (res.ok) {
            toast.success("¡Perfil vinculado a tu cuenta!");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
    >
      <UserCheckIcon />
      Este es mi perfil
    </Button>
  );
}

/** Admin action to unlink a profile from its account. */
export function UnlinkProfileButton({ playerId }: { playerId: number }) {
  const router = useRouter();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await unlinkPlayer(playerId);
          if (res.ok) {
            toast.success("Perfil desvinculado.");
            router.refresh();
          } else {
            toast.error(res.error);
          }
        })
      }
    >
      <Unlink2Icon />
      Desvincular cuenta
    </Button>
  );
}
