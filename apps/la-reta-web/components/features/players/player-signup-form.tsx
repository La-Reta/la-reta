"use client";

import { createPlayerSignup } from "@/app/actions/player-signups";
import { CountrySelect } from "@/components/features/players/country-select";
import { PhotoField } from "@/components/features/players/photo-field";
import { PositionSelect } from "@/components/features/players/position-select";
import { SignupPreviewCard } from "@/components/features/players/signup-preview-card";
import { SPRING_POP } from "@/components/motion/motion-tokens";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FEET } from "@/lib/constants";
import type { PhotoUpload } from "@/lib/upload-photo";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ContactIcon,
  RulerIcon,
  SendIcon,
  ShirtIcon,
  UserRoundPlusIcon,
} from "lucide-react";
import { m } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

const FOOT_LABEL: Record<string, string> = {
  left: "Izquierdo",
  right: "Derecho",
  both: "Ambos",
};

/**
 * El tope de "fecha de nacimiento" es hoy, y hoy solo se sabe en el navegador:
 * el servidor renderiza en UTC y el cliente en su zona, así que a ciertas horas
 * los dos no coinciden y React avisa de desajuste de hidratación.
 *
 * `useSyncExternalStore` es la vía sancionada para eso —usa el snapshot de
 * servidor al hidratar y cambia después— en vez de un `useEffect` que asigna
 * estado, que además provoca un render en cascada. No hay suscripción porque el
 * valor no cambia mientras la página vive; y `getSnapshot` puede devolver una
 * cadena nueva cada vez porque React las compara por valor.
 */
const subscribeNever = () => () => {
  // nada a lo que suscribirse: la fecha no cambia durante la vida de la página
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const noSnapshotOnServer = () => undefined;

const EMPTY = {
  name: "",
  displayName: "",
  position: "ST",
  position2: "",
  preferredFoot: "right",
  nationality: "mx",
  photoUrl: "",
  birthDate: "",
  heightCm: "",
  weightKg: "",
  contact: "",
  note: "",
};

export const PlayerSignupForm = () => {
  const router = useRouter();
  const [form, setForm] = React.useState(EMPTY);
  const [sent, setSent] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  // La subida vive aquí y no dentro del campo: quien la enseña es la carta.
  // El campo la empieza, la carta la pinta.
  const [photoUpload, setPhotoUpload] = React.useState<PhotoUpload | null>(
    null
  );

  const maxBirthDate = React.useSyncExternalStore<string | undefined>(
    subscribeNever,
    todayISO,
    noSnapshotOnServer
  );

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Escribe tu nombre.");
      return;
    }
    startTransition(async () => {
      const res = await createPlayerSignup({
        ...form,
        client: collectClientInfo(),
      });
      if (res.ok) {
        toast.success("¡Solicitud enviada! Te avisaremos.");
        setForm(EMPTY);
        setPhotoUpload(null);
        setSent(true);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  if (sent) return <SignupSent onReset={() => setSent(false)} />;

  return (
    // La carta va en su propia columna en escritorio y **debajo** en el
    // teléfono: ahí ocupa media pantalla, y quien rellena el formulario con el
    // pulgar necesita ver los campos, no la carta. `lg:sticky` en la carta la
    // deja a la vista mientras se baja por el formulario.
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <UserRoundPlusIcon className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>Regístrate como jugador</CardTitle>
              <p className="text-muted-foreground text-sm text-balance">
                Deja tus datos y un admin te dará de alta en la plantilla.
              </p>
            </div>
          </div>
        </CardHeader>
        {/* `@container` y no breakpoints de viewport: la tarjeta decide por su
          propio ancho, así que el formulario sigue partiéndose bien si mañana
          entra en una columna estrecha o en un diálogo. */}
        <CardContent className="@container">
          <form onSubmit={onSubmit} className="py-2">
            <StaggerGroup className="space-y-8">
              <StaggerItem>
                <Section icon={UserRoundPlusIcon} title="Tu ficha">
                  <div className="@md:col-span-2">
                    <PhotoField
                      value={form.photoUrl}
                      upload={photoUpload}
                      onChange={(url) => set("photoUrl", url)}
                      onUploadChange={setPhotoUpload}
                      disabled={pending}
                    />
                  </div>
                  <SignupField
                    label="Nombre completo"
                    className="@md:col-span-2"
                  >
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Erling Haaland"
                      maxLength={120}
                      autoComplete="name"
                      required
                    />
                  </SignupField>
                  <SignupField label="¿Cómo te dicen?" optional>
                    <Input
                      value={form.displayName}
                      onChange={(e) => set("displayName", e.target.value)}
                      placeholder="HAALAND"
                      maxLength={60}
                      autoComplete="nickname"
                    />
                  </SignupField>
                  <SignupField label="País">
                    <CountrySelect
                      value={form.nationality}
                      onChange={(code) => set("nationality", code)}
                    />
                  </SignupField>
                </Section>
              </StaggerItem>

              <StaggerItem>
                <Section icon={ShirtIcon} title="En la cancha">
                  <SignupField label="Posición principal">
                    <PositionSelect
                      onChange={(next) => set("position", next)}
                      value={form.position}
                    />
                  </SignupField>
                  <SignupField label="Posición secundaria" optional>
                    <PositionSelect
                      exclude={form.position}
                      onChange={(next) => set("position2", next)}
                      placeholder="Ninguna"
                      value={form.position2}
                    />
                  </SignupField>
                  <SignupField label="Pie preferido" className="@md:col-span-2">
                    <NativeSelect
                      className="w-full"
                      value={form.preferredFoot}
                      onChange={(e) => set("preferredFoot", e.target.value)}
                    >
                      {FEET.map((f) => (
                        <NativeSelectOption key={f} value={f}>
                          {FOOT_LABEL[f]}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </SignupField>
                </Section>
              </StaggerItem>

              <StaggerItem>
                <Section icon={RulerIcon} title="Físico" hint="Todo opcional">
                  <SignupField label="Fecha de nacimiento" optional>
                    <Input
                      type="date"
                      max={maxBirthDate}
                      value={form.birthDate}
                      onChange={(e) => set("birthDate", e.target.value)}
                      className="w-full"
                    />
                  </SignupField>
                  <div className="grid grid-cols-2 gap-4">
                    <SignupField label="Altura" optional>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={form.heightCm}
                        onChange={(e) => set("heightCm", e.target.value)}
                        placeholder="175"
                        aria-label="Altura en centímetros"
                      />
                    </SignupField>
                    <SignupField label="Peso" optional>
                      <Input
                        type="number"
                        inputMode="numeric"
                        value={form.weightKg}
                        onChange={(e) => set("weightKg", e.target.value)}
                        placeholder="75"
                        aria-label="Peso en kilogramos"
                      />
                    </SignupField>
                  </div>
                </Section>
              </StaggerItem>

              <StaggerItem>
                <Section
                  icon={ContactIcon}
                  title="Para localizarte"
                  hint="Todo opcional"
                >
                  <SignupField
                    label="Contacto"
                    className="@md:col-span-2"
                    optional
                  >
                    <Input
                      value={form.contact}
                      onChange={(e) => set("contact", e.target.value)}
                      placeholder="WhatsApp, correo o @usuario"
                      maxLength={160}
                    />
                  </SignupField>
                  <SignupField
                    label="Algo más"
                    className="@md:col-span-2"
                    optional
                  >
                    <Textarea
                      value={form.note}
                      onChange={(e) => set("note", e.target.value)}
                      placeholder="Cuéntanos tu estilo de juego, disponibilidad, etc."
                      rows={3}
                    />
                  </SignupField>
                  <p className="bg-muted/40 text-muted-foreground rounded-lg border p-3 text-xs leading-relaxed @md:col-span-2">
                    Al enviar guardamos información técnica básica del navegador
                    para evitar abuso. Un administrador definirá tus atributos
                    al darte de alta.
                  </p>
                </Section>
              </StaggerItem>
            </StaggerGroup>

            {/* En el teléfono el botón se queda a la vista al hacer scroll: el
              formulario es largo y el envío no puede quedar a tres pantallas.
              Fondo opaco a propósito — un `backdrop-filter` en un `sticky`
              deja media lista sin pintar en Chrome (ver CLAUDE.md). El bleed usa
              el mismo `--card-spacing` que la tarjeta, así que no se desalinean. */}
            <div className="bg-card sticky bottom-0 -mx-(--card-spacing) flex flex-col-reverse gap-3 border-t px-(--card-spacing) py-4 @md:static @md:mx-0 @md:flex-row @md:items-center @md:justify-between @md:border-0 @md:bg-transparent @md:px-0">
              <Button
                type="button"
                variant="outline"
                render={<Link href="/players" />}
                size="sm"
              >
                <ChevronLeftIcon />
                Volver a jugadores
              </Button>
              <Button
                type="submit"
                disabled={pending}
                size="lg"
                className="w-full @md:w-fit"
              >
                <SendIcon />
                {pending ? "Enviando…" : "Enviar solicitud"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <SignupPreviewCard
        name={form.name}
        displayName={form.displayName}
        position={form.position}
        position2={form.position2}
        photoUrl={form.photoUrl}
        upload={photoUpload}
      />
    </div>
  );
};

const Section = ({
  icon: Icon,
  title,
  hint,
  children,
}: {
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly title: string;
  readonly hint?: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-muted-foreground size-4 shrink-0" />
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {hint ? (
          <span className="text-muted-foreground text-xs">· {hint}</span>
        ) : null}
        <span className="bg-border ml-2 h-px flex-1" />
      </div>
      <div className="grid gap-4 @md:grid-cols-2">{children}</div>
    </section>
  );
};

const SignupField = ({
  label,
  optional,
  className,
  children,
}: {
  readonly label: string;
  readonly optional?: boolean;
  readonly className?: string;
  readonly children: React.ReactNode;
}) => {
  return (
    <Field className={className}>
      <FieldLabel className="text-xs">
        {label}
        {optional ? (
          <span className="text-muted-foreground font-normal"> (opcional)</span>
        ) : null}
      </FieldLabel>
      {children}
    </Field>
  );
};

const SignupSent = ({ onReset }: { readonly onReset: () => void }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <m.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={SPRING_POP}
          className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2Icon className="size-6" />
        </m.div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold tracking-tight">
            Solicitud enviada
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Un administrador la revisará y te dará de alta en la plantilla con
            tus atributos. ¡Nos vemos en la cancha!
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="secondary" onClick={onReset}>
            Enviar otra
          </Button>
          <Button variant="outline" render={<Link href="/players" />}>
            Ver jugadores
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

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
  };
}
