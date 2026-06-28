import {
  LegalGrid,
  LegalList,
  LegalNote,
  LegalPoint,
  LegalReferences,
  LegalSection,
  LegalShell,
  legalPages,
} from "@/components/features/legal/legal-content";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal · Reta Credix",
  description:
    "Centro legal de Reta Credix: privacidad, términos, uso de IA y contenido comunitario.",
};

const coveredData = [
  "Datos de jugadores: nombre, nombre visible, imagen o URL de foto, nacionalidad, edad, estatura, peso, posición, pie preferido y estadísticas deportivas.",
  "Actividad deportiva: partidos, equipos, goles, historial de atributos, comentarios, valoraciones y notas relacionadas con la reta.",
  "Contenido comunitario: ideas, palabras para dinámicas, autor opcional y mensajes enviados por usuarios.",
  "Datos técnicos básicos: idioma, zona horaria, resolución de pantalla, plataforma y user agent para métricas, diagnóstico y seguridad.",
];

export default function LegalPage() {
  return (
    <LegalShell
      eyebrow="Legal y privacidad"
      title="Reglas claras para una reta más segura"
      description="Estas páginas explican cómo se usa la información dentro de Reta Credix, qué significa el nombre de la comunidad, qué límites hay sobre marcas de terceros y cómo se manejarán funciones asistidas por IA."
    >
      <LegalNote>
        Reta Credix es una app comunitaria e informal. Estos documentos son una
        base operativa para reducir riesgos, pero deben ser revisados por la
        persona responsable del proyecto y por asesoría legal si la app crece,
        se monetiza o maneja datos de menores.
      </LegalNote>

      <LegalGrid>
        {legalPages.slice(1).map((page) => (
          <LegalPoint key={page.href} title={page.title}>
            {page.description}
            <span className="mt-3 block">
              <Button
                size="sm"
                variant="outline"
                render={<Link href={page.href} />}
              >
                Leer documento
              </Button>
            </span>
          </LegalPoint>
        ))}
      </LegalGrid>

      <LegalSection
        title="Qué cubren estas páginas"
        description="Resumen de los puntos importantes para usuarios, jugadores y administradores."
      >
        <LegalList items={coveredData} />
      </LegalSection>

      <LegalSection title="Marcas y nombre Credix">
        <p className="text-muted-foreground">
          El nombre “Credix” se usa aquí como identificador informal de la reta
          y su comunidad. No implica afiliación, patrocinio, autorización ni
          relación comercial con CredixGS, Credix de Chile, EA SPORTS, FIFA,
          organizaciones deportivas, instituciones financieras o cualquier otra
          marca de terceros.
        </p>
        <p className="text-muted-foreground">
          Si una persona o titular de derechos considera que el uso de un
          nombre, imagen, logo, marca o referencia puede causar confusión o
          afectar sus derechos, puede solicitar revisión con los administradores
          de la reta para corregir, retirar o aclarar el contenido.
        </p>
      </LegalSection>

      <LegalReferences />
    </LegalShell>
  );
}
