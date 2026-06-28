"use client";

import { acceptLegalTerms } from "@/app/actions/legal";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal";
import { ScaleIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

const CONSENT_STORAGE_KEY = `reta-legal-consent:${LEGAL_CONSENT_VERSION}`;
const CONSENT_EVENT = "reta-legal-consent-updated";

export function LegalConsentAlert() {
  const accepted = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  const [pending, startTransition] = React.useTransition();

  if (accepted) return null;

  function onAccept() {
    startTransition(async () => {
      const res = await acceptLegalTerms(collectClientInfo());

      if (res.ok) {
        localStorage.setItem(
          CONSENT_STORAGE_KEY,
          JSON.stringify({
            version: LEGAL_CONSENT_VERSION,
            acceptedAt: new Date().toISOString(),
          }),
        );
        window.dispatchEvent(new Event(CONSENT_EVENT));
        toast.success("Términos aceptados");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Alert className="border-primary/20 bg-primary/5 pr-4 sm:pr-44">
      <ScaleIcon className="text-primary" />
      <AlertTitle>Uso responsable y documentos legales</AlertTitle>
      <AlertDescription className="max-w-4xl">
        Para usar Reta Credix aceptas los{" "}
        <Link href="/legal/terminos">términos y condiciones</Link>, el{" "}
        <Link href="/legal/privacidad">aviso de privacidad</Link> y la política
        de <Link href="/legal/ia-y-contenido">IA y contenido</Link>. Al aceptar
        guardamos evidencia técnica mínima del dispositivo y conexión para
        seguridad, auditoría y defensa del proyecto.
      </AlertDescription>
      <AlertAction className="static mt-3 sm:absolute sm:top-2.5 sm:right-3 sm:mt-0">
        <Button size="sm" onClick={onAccept} disabled={pending}>
          <ShieldCheckIcon />
          {pending ? "Guardando..." : "Aceptar términos"}
        </Button>
      </AlertAction>
    </Alert>
  );
}

function subscribeConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CONSENT_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CONSENT_EVENT, callback);
  };
}

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_STORAGE_KEY) !== null;
}

function getServerConsentSnapshot() {
  return false;
}

function collectClientInfo() {
  const uaData = (
    navigator as unknown as { userAgentData?: { platform?: string } }
  ).userAgentData;

  return {
    language: navigator.language,
    languages: navigator.languages?.join(","),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    screen:
      typeof screen !== "undefined"
        ? `${screen.width}x${screen.height}`
        : undefined,
    viewport:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : undefined,
    pixelRatio:
      typeof window !== "undefined"
        ? String(window.devicePixelRatio)
        : undefined,
    platform: uaData?.platform ?? navigator.platform,
    userAgent: navigator.userAgent,
    sourcePath:
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/",
  };
}
