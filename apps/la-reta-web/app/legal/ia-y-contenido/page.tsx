import {
  LegalList,
  LegalNote,
  LegalSection,
  LegalShell,
} from "@/components/features/legal/legal-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IA y contenido · Reta Credix",
  description:
    "Política base sobre uso de inteligencia artificial, contenido generado y revisión humana en Reta Credix.",
};

const aiUses = [
  "Ayudar a redactar, resumir o clasificar ideas, comentarios, partidos o notas administrativas.",
  "Generar análisis visuales, explicaciones, rankings, dashboards o resúmenes deportivos a partir de datos de la reta.",
  "Detectar posibles errores, duplicados, contenido ofensivo o información que requiera revisión humana.",
  "Crear apoyo visual o textos de interfaz, siempre cuidando que no suplanten a personas ni marcas reales.",
];

const aiLimits = [
  "La IA puede equivocarse, inventar contexto o interpretar mal estadísticas, apodos, comentarios o desempeño deportivo.",
  "No debe tomar decisiones finales sobre sanciones, eliminación de datos, permisos, reputación de jugadores o temas sensibles sin revisión humana.",
  "No se deben enviar datos innecesarios, documentos privados, información financiera, salud, direcciones, teléfonos o datos de menores sin autorización adecuada.",
  "Cuando se genere contenido sobre una persona, debe poder corregirse, ocultarse o eliminarse si la persona afectada lo solicita razonablemente.",
];

export default function AiAndContentPage() {
  return (
    <LegalShell
      eyebrow="IA y contenido"
      title="IA como asistente, no como árbitro"
      description="Reta Credix puede usar inteligencia artificial para mejorar análisis, redacción y visualización, pero las decisiones importantes deben conservar revisión humana."
    >
      <LegalNote>
        Si una función de IA procesa nombres, imágenes, comentarios o
        estadísticas de jugadores, el equipo administrador debe informar el uso
        de forma clara y limitar los datos enviados a lo estrictamente
        necesario.
      </LegalNote>

      <LegalSection title="Usos permitidos de IA">
        <LegalList items={aiUses} />
      </LegalSection>

      <LegalSection title="Límites y cuidado humano">
        <LegalList items={aiLimits} />
      </LegalSection>

      <LegalSection title="Contenido generado o asistido">
        <p className="text-muted-foreground">
          Los textos, gráficos, resúmenes, etiquetas, rankings o diseños
          generados con IA pueden ser aproximados. Deben revisarse antes de
          publicarse cuando mencionen personas reales, marcas, desempeño
          individual o datos que puedan afectar la percepción de alguien.
        </p>
        <p className="text-muted-foreground">
          La app no debe presentar contenido generado como si fuera una fuente
          oficial, una decisión definitiva o una evaluación profesional. Debe
          entenderse como una ayuda para organizar mejor la información de la
          reta.
        </p>
      </LegalSection>

      <LegalSection title="Datos que pueden enviarse a proveedores">
        <p className="text-muted-foreground">
          Dependiendo de la función, podrían enviarse datos como nombres de
          jugadores, apodos, estadísticas, goles, comentarios, ideas, fechas de
          partidos o notas. Se debe evitar enviar imágenes, identificadores
          sensibles o datos técnicos completos cuando no sean necesarios.
        </p>
        <p className="text-muted-foreground">
          Si en el futuro se integra un proveedor específico de IA, analítica o
          almacenamiento, se recomienda documentar su nombre, finalidad, país o
          región de tratamiento y enlace a sus términos o políticas.
        </p>
      </LegalSection>

      <LegalSection title="Correcciones y objeciones">
        <p className="text-muted-foreground">
          Cualquier persona mencionada por una función asistida por IA puede
          pedir corrección, explicación, ocultamiento o eliminación del
          contenido cuando sea incorrecto, invasivo, confuso, ofensivo o
          innecesario para la finalidad de la reta.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
