"use client";

import * as React from "react";
import { RefreshCwIcon, ShieldAlertIcon } from "lucide-react";
import { ErrorState } from "@/components/app/error-state";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      code="500"
      icon={<ShieldAlertIcon />}
      title="Algo se rompió en la jugada"
      description="La app tuvo un problema al cargar esta vista. Puede ser temporal, así que intenta recargar esta sección."
      details={
        error.digest ? (
          <span>
            Código de seguimiento:{" "}
            <span className="text-foreground font-mono">{error.digest}</span>
          </span>
        ) : (
          "Si el problema continúa, vuelve al inicio y prueba de nuevo desde otra sección."
        )
      }
      actions={
        <Button variant={"destructive"} onClick={() => unstable_retry()}>
          <RefreshCwIcon />
          Reintentar
        </Button>
      }
    />
  );
}
