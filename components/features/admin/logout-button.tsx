"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
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
