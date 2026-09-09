"use client";

import { PlayerSignupForm } from "@/components/features/players/player-signup-form";
import { gsap, NO_REDUCED_MOTION, useGSAP } from "@/components/motion/gsap";
import { FADE_DURATION, SPRING_SNAP } from "@/components/motion/motion-tokens";
import { usePageVisible } from "@/components/motion/use-page-visible";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import {
  CameraIcon,
  IdCardIcon,
  LogInIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import * as React from "react";

/**
 * Puerta del registro de jugador.
 *
 * Registrarse pide cuenta. No es burocracia: la solicitud queda atada a la
 * cuenta que la manda (`player_signups.clerk_user_id`), y eso es lo que permite
 * que al aprobarla la ficha nazca ya vinculada a su dueño en vez de tener que
 * reclamarla después a mano. Además subir la foto necesita sesión de todas
 * formas — `/api/blob/upload` no firma el token sin `userId`.
 *
 * `initialSignedIn` viene del `auth()` del servidor: sin él, entre el primer
 * pintado y el momento en que Clerk resuelve en el cliente, a quien ya tiene
 * sesión le parpadea la puerta antes del formulario.
 *
 * Los botones van en `mode="modal"`, que es el patrón de la casa (`HeaderAuth`,
 * `PlayerComments`): la sesión se inicia encima de esta misma vista y al cerrar
 * el diálogo `isSignedIn` cambia en vivo, así que el formulario entra donde
 * estaba la puerta sin navegar a ningún lado ni perder lo que hubiera escrito.
 */
export const SignupGate = ({
  initialSignedIn,
}: {
  readonly initialSignedIn: boolean;
}) => {
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded ? isSignedIn === true : initialSignedIn;

  return (
    <AnimatePresence initial={false} mode="wait">
      {signedIn ? (
        <m.div
          key="form"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION }}
        >
          <PlayerSignupForm />
        </m.div>
      ) : (
        <m.div
          key="gate"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: FADE_DURATION }}
        >
          <Gate />
        </m.div>
      )}
    </AnimatePresence>
  );
};

const REASONS = [
  {
    icon: IdCardIcon,
    text: "Tu ficha queda a tu nombre desde el primer día, sin reclamarla después.",
  },
  {
    icon: CameraIcon,
    text: "Puedes subir tu foto — sin cuenta no hay dónde guardarla.",
  },
  {
    icon: ShieldCheckIcon,
    text: "Nos ahorra solicitudes falsas y duplicadas.",
  },
];

const Gate = () => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const pulse = React.useRef<gsap.core.Timeline | null>(null);
  const visible = usePageVisible();

  /**
   * El aro que late detrás del escudo.
   *
   * Es GSAP y no Motion porque es un bucle infinito que hay que **pausar** desde
   * fuera: un timeline se para y se reanuda desde cualquier sitio, mientras que
   * un `animate` de Motion habría que desmontarlo o rehacerlo con estado. Ver
   * CLAUDE.md, «cuándo toca cuál».
   */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED_MOTION, () => {
        pulse.current = gsap
          .timeline({ repeat: -1 })
          .fromTo(
            ".gate-ring",
            { scale: 0.85, opacity: 0.5 },
            { scale: 1.6, opacity: 0, duration: 2, ease: "none" }
          );
      });
      return () => mm.revert();
    },
    { scope: rootRef }
  );

  // En segundo plano el navegador congela el frameloop: un bucle que sigue
  // "corriendo" ahí solo acumula trabajo para cuando se vuelve a la pestaña.
  useGSAP(
    () => {
      if (visible) pulse.current?.play();
      else pulse.current?.pause();
    },
    { dependencies: [visible], scope: rootRef }
  );

  return (
    <Card ref={rootRef} className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="relative flex size-16 items-center justify-center">
          <span className="gate-ring bg-primary/25 absolute inset-0 rounded-2xl" />
          <span className="bg-primary/10 text-primary relative flex size-16 items-center justify-center rounded-2xl">
            <ShieldCheckIcon className="size-7" />
          </span>
        </div>

        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-balance">
            Crea tu cuenta para registrarte
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed text-balance">
            Es un paso y se hace aquí mismo, sin salir de esta página.
          </p>
        </div>

        <ul className="w-full max-w-md space-y-2 text-left">
          {REASONS.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="bg-muted/40 text-muted-foreground flex items-start gap-3 rounded-lg border p-3 text-sm"
            >
              <Icon className="text-primary mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{text}</span>
            </li>
          ))}
        </ul>

        <div className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:justify-center">
          <m.div whileTap={{ scale: 0.97 }} transition={SPRING_SNAP}>
            <SignUpButton mode="modal">
              <Button className="w-full sm:w-auto" size="lg">
                <IdCardIcon />
                Crear cuenta
              </Button>
            </SignUpButton>
          </m.div>
          <m.div whileTap={{ scale: 0.97 }} transition={SPRING_SNAP}>
            <SignInButton mode="modal">
              <Button className="w-full sm:w-auto" size="lg" variant="outline">
                <LogInIcon />
                Ya tengo cuenta
              </Button>
            </SignInButton>
          </m.div>
        </div>
      </CardContent>
    </Card>
  );
};
