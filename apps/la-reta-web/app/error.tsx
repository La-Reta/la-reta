"use client";

import * as React from "react";
import { RefreshCwIcon, ShieldAlertIcon } from "lucide-react";
import { ErrorState } from "@/components/app/error-state";
import { Button } from "@/components/ui/button";

const ErrorBoundary = ({
  error,
  unstable_retry,
}: {
  readonly error: Error & { digest?: string };
  readonly unstable_retry: () => void;
}) => {
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
        <Button onClick={() => unstable_retry()}>
          <RefreshCwIcon />
          Reintentar
        </Button>
      }
    />
  );
};

export default ErrorBoundary;
