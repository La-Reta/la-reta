"use client";

import { logoutAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await logoutAdmin();
          router.refresh();
        })
      }
    >
      <LogOutIcon />
      Salir
    </Button>
  );
}
