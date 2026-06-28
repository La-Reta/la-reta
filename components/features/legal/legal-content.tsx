import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BotIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ScaleIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { LegalNav } from "./legal-nav";

export const LEGAL_UPDATED_AT = "28 de junio de 2026";

export const legalPages = [
  {
    title: "Centro legal",
    href: "/legal",
    description: "Resumen rápido de documentos, datos y responsabilidades.",
    icon: ScaleIcon,
  },
  {
    title: "Privacidad",
    href: "/legal/privacidad",
    description: "Datos personales, finalidad, conservación y derechos ARCO.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Términos",
    href: "/legal/terminos",
    description: "Uso permitido, contenido de jugadores y marcas mencionadas.",
    icon: FileTextIcon,
  },
  {
    title: "IA y contenido",
    href: "/legal/ia-y-contenido",
    description:
      "Uso responsable de funciones asistidas por inteligencia artificial.",
    icon: BotIcon,
  },
];

export function LegalShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6">
      <section className="border-border/70 bg-card relative overflow-hidden rounded-3xl border p-6 shadow-xs sm:p-8">
        <div
          aria-hidden="true"
          className="from-primary/12 via-primary/4 pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops),transparent_42%)]"
        />
        <div className="relative max-w-3xl">
          <Badge variant="outline">{eyebrow}</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed text-pretty sm:text-base">
            {description}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge variant="secondary">Actualizado: {LEGAL_UPDATED_AT}</Badge>
            <Badge variant="outline">Documento base, no asesoría legal</Badge>
          </div>
        </div>
      </section>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
        <LegalNav />
        <main className="min-w-0 space-y-4">{children}</main>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

export function LegalGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function LegalPoint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-muted/35 rounded-2xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="text-muted-foreground grid gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
          <span className="min-w-0 break-words">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-primary/20 bg-primary/5 text-muted-foreground rounded-2xl border p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

export function LegalReferences() {
  return (
    <LegalSection
      title="Referencias útiles"
      description="Fuentes oficiales para revisar y adaptar estos documentos."
    >
      <div className="grid gap-3">
        <ReferenceLink href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf">
          Ley Federal de Protección de Datos Personales en Posesión de los
          Particulares
        </ReferenceLink>
        <ReferenceLink href="https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LFPDPPP.pdf">
          Reglamento de la Ley Federal de Protección de Datos Personales en
          Posesión de los Particulares
        </ReferenceLink>
      </div>
      <Separator />
      <p className="text-muted-foreground text-xs">
        Estos enlaces son referencias públicas. La implementación final debe
        ajustarse con la persona responsable del proyecto y, de ser posible, con
        asesoría legal.
      </p>
    </LegalSection>
  );
}

function ReferenceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="outline"
      className="h-auto justify-between gap-3 px-3 py-2 text-left"
      render={<Link href={href} target="_blank" rel="noreferrer" />}
    >
      <span className="min-w-0 break-words">{children}</span>
      <ExternalLinkIcon className="size-4 shrink-0" />
    </Button>
  );
}
