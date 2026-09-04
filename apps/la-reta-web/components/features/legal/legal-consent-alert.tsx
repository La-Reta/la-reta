"use client";

import { ScaleIcon, ShieldAlertIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { acceptLegalTerms } from "@/app/actions/legal";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { LEGAL_CONSENT_VERSION } from "@/lib/legal";

const CONSENT_STORAGE_KEY = `reta-legal-consent:${LEGAL_CONSENT_VERSION}`;
const REJECTION_STORAGE_KEY = `reta-legal-rejection:${LEGAL_CONSENT_VERSION}`;
const CONSENT_EVENT = "reta-legal-consent-updated";

type ConsentState = "accepted" | "rejected" | "pending";

export function LegalConsentGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLegalRoute = pathname === "/legal" || pathname.startsWith("/legal/");
  const consent = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );

  if (consent === "accepted") return children;

  if (isLegalRoute) {
    return (
      <>
        {children}
        <LegalConsentInline />
      </>
    );
  }

  if (consent === "rejected") {
    return <LegalConsentBlocked />;
  }

  return (
    <>
      {children}
      <LegalConsentDrawer />
    </>
  );
}

function LegalConsentInline() {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="bg-card/95 ring-foreground/10 sticky bottom-4 z-30 mx-auto mt-6 max-w-3xl rounded-2xl p-3 shadow-lg ring-1 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          Puedes leer estos documentos antes de decidir. Si estás de acuerdo,
          acepta para usar el resto de la app.
        </p>
        <div className="shrink-0 sm:w-44">
          <ConsentAcceptButton
            pending={pending}
            onAccept={() => accept(startTransition)}
          />
        </div>
      </div>
    </div>
  );
}

function LegalConsentDrawer() {
  const [pending, startTransition] = React.useTransition();

  return (
    <Drawer open disablePointerDismissal>
      <DrawerContent className="bg-card/95 mx-auto max-w-5xl border-x shadow-2xl backdrop-blur-xl">
        <div className="grid gap-4 px-4 pb-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <DrawerHeader className="px-0 text-left sm:text-left">
            <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-2xl">
              <ScaleIcon className="size-5" />
            </div>
            <DrawerTitle className="text-xl font-semibold tracking-tight">
              Uso responsable y documentos legales
            </DrawerTitle>
            <DrawerDescription className="max-w-3xl leading-relaxed">
              Para usar Reta Credix aceptas los{" "}
              <Button
                render={<Link href="/legal/terminos"></Link>}
                variant={"link"}
                className={"p-0"}
              >
                términos y condiciones
              </Button>
              , el{" "}
              <Button
                render={<Link href="/legal/privacidad"></Link>}
                variant={"link"}
                className={"p-0"}
              >
                aviso de privacidad
              </Button>{" "}
              y la política de{" "}
              <Button
                render={<Link href="/legal/ia-y-contenido"></Link>}
                variant={"link"}
                className={"p-0"}
              >
                IA y contenido
              </Button>
              . Al aceptar guardamos evidencia técnica mínima del dispositivo y
              conexión para seguridad, auditoría y defensa del proyecto.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerFooter className="px-0 pt-0 sm:min-w-64">
            <ConsentAcceptButton
              pending={pending}
              onAccept={() => accept(startTransition)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={reject}
              disabled={pending}
            >
              Rechazar
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function LegalConsentBlocked() {
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="mx-auto grid min-h-[calc(100svh-7rem)] max-w-2xl place-items-center py-10">
      <section className="bg-card ring-foreground/10 w-full rounded-3xl p-6 text-center shadow-sm ring-1 sm:p-8">
        <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-2xl">
          <ShieldAlertIcon className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          No es posible usar la app sin consentimiento
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
          Para navegar y usar Reta Credix necesitamos tu aceptación de los
          términos, aviso de privacidad y política de IA. Esto nos permite
          operar la comunidad con reglas claras y guardar evidencia mínima para
          auditoría y seguridad.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
          <Link className="underline underline-offset-4" href="/legal/terminos">
            Términos
          </Link>
          <Link
            className="underline underline-offset-4"
            href="/legal/privacidad"
          >
            Privacidad
          </Link>
          <Link
            className="underline underline-offset-4"
            href="/legal/ia-y-contenido"
          >
            IA y contenido
          </Link>
        </div>
        <div className="mx-auto mt-6 max-w-xs">
          <ConsentAcceptButton
            pending={pending}
            onAccept={() => accept(startTransition)}
          />
        </div>
      </section>
    </div>
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
  if (localStorage.getItem(CONSENT_STORAGE_KEY)) return "accepted";
  if (localStorage.getItem(REJECTION_STORAGE_KEY)) return "rejected";
  return "pending";
}

function getServerConsentSnapshot() {
  return "pending" satisfies ConsentState;
}

function accept(startTransition: React.TransitionStartFunction) {
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
      localStorage.removeItem(REJECTION_STORAGE_KEY);
      window.dispatchEvent(new Event(CONSENT_EVENT));
      toast.success("Términos aceptados");
    } else {
      toast.error(res.error);
    }
  });
}

function reject() {
  localStorage.setItem(
    REJECTION_STORAGE_KEY,
    JSON.stringify({
      version: LEGAL_CONSENT_VERSION,
      rejectedAt: new Date().toISOString(),
    }),
  );
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function ConsentAcceptButton({
  pending,
  onAccept,
}: {
  pending: boolean;
  onAccept: () => void;
}) {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={onAccept}
      disabled={pending}
    >
      <ShieldCheckIcon />
      {pending ? "Guardando..." : "Aceptar términos"}
    </Button>
  );
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
