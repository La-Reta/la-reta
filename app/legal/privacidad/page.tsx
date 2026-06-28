import {
  LegalList,
  LegalNote,
  LegalReferences,
  LegalSection,
  LegalShell,
} from "@/components/features/legal/legal-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso de privacidad · Reta Credix",
  description:
    "Aviso de privacidad base para datos de jugadores, comunidad, comentarios, métricas técnicas e IA en Reta Credix.",
};

const personalData = [
  "Identificación deportiva: nombre, display name o apodo, nacionalidad, posición, pie preferido y fotografía o URL de imagen.",
  "Perfil físico/deportivo: edad o fecha de nacimiento si se agrega en el futuro, estatura, peso, atributos tipo FIFA, overall e historial de cambios.",
  "Actividad en la reta: partidos jugados, goles, equipo asignado, comentarios, valoraciones, ideas, palabras comunitarias y notas internas de administración.",
  "Datos técnicos de uso: idioma, zona horaria, resolución de pantalla, plataforma, navegador o user agent, además de datos estadísticos de analítica si se habilitan herramientas como Cloudflare Analytics.",
  "Evidencia de aceptación legal: versión aceptada, documentos aceptados, fecha y hora, ruta de origen, IP disponible en el request, país aproximado si el proveedor lo informa y encabezados técnicos básicos como accept-language.",
];

const purposes = [
  "Administrar jugadores, posiciones, estadísticas, historial, equipos y partidos de la reta.",
  "Mostrar fichas públicas o internas de jugadores con imagen, nombre visible y desempeño deportivo.",
  "Recibir ideas, comentarios y palabras comunitarias, incluyendo autor opcional o participación anónima.",
  "Generar métricas, detectar errores, mejorar diseño responsive, seguridad y experiencia de uso.",
  "Usar funciones asistidas por IA para resumir, organizar, moderar o visualizar información, siempre como apoyo y no como decisión definitiva sin revisión humana.",
];

const rights = [
  "Acceso: pedir qué datos existen sobre una persona dentro de la app.",
  "Rectificación: solicitar correcciones de nombre, imagen, estadísticas, comentarios o datos inexactos.",
  "Cancelación: pedir eliminación cuando ya no sea necesario conservar la información o cuando la persona retire su consentimiento.",
  "Oposición: pedir que ciertos datos no se muestren, no se usen para métricas o no se procesen con herramientas asistidas por IA.",
];

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="Aviso de privacidad"
      title="Cómo cuidamos los datos de la reta"
      description="Este aviso explica qué información puede guardar Reta Credix, para qué se usa, con quién podría compartirse y cómo solicitar cambios o eliminación."
    >
      <LegalNote>
        Este aviso está pensado para una comunidad deportiva privada o semi
        pública. Si la app se abre al público general, monetiza, usa datos de
        menores o integra proveedores externos nuevos, se debe revisar y
        actualizar antes de operar.
      </LegalNote>

      <LegalSection title="Responsable">
        <p className="text-muted-foreground">
          El responsable operativo de los datos es el equipo administrador de
          Reta Credix. Las solicitudes de privacidad deben realizarse por el
          canal oficial de la reta o directamente con la persona administradora
          responsable.
        </p>
      </LegalSection>

      <LegalSection title="Datos que podemos tratar">
        <LegalList items={personalData} />
      </LegalSection>

      <LegalSection title="Finalidades">
        <LegalList items={purposes} />
      </LegalSection>

      <LegalSection title="Imágenes, perfiles y datos de jugadores">
        <p className="text-muted-foreground">
          La imagen, nombre, apodo, nacionalidad, edad, datos físicos y
          estadísticas de un jugador solo deben publicarse cuando exista
          autorización de la persona o una base comunitaria clara para su uso.
          Si alguien pide ocultar o retirar su imagen, el equipo administrador
          debe atender la solicitud en un plazo razonable.
        </p>
        <p className="text-muted-foreground">
          En caso de menores de edad, se debe contar con autorización de madre,
          padre, tutor o representante legal antes de guardar o mostrar datos
          identificables, especialmente imágenes, edad, fecha de nacimiento o
          rendimiento individual.
        </p>
      </LegalSection>

      <LegalSection title="Herramientas externas e IA">
        <p className="text-muted-foreground">
          La app puede usar proveedores técnicos para hosting, base de datos,
          analítica, monitoreo o funciones de inteligencia artificial. Cuando se
          usen estas herramientas, se debe limitar la información enviada a lo
          necesario y evitar compartir datos sensibles que no sean
          indispensables para la función.
        </p>
      </LegalSection>

      <LegalSection title="Aceptación de términos y evidencia técnica">
        <p className="text-muted-foreground">
          Cuando una persona acepta los términos desde el dashboard, la app
          registra una evidencia mínima para auditoría, seguridad y defensa del
          proyecto. Esta evidencia puede incluir versión legal aceptada, fecha,
          ruta de origen, idioma, zona horaria, pantalla, viewport, plataforma,
          user agent, IP disponible en el request, encabezado x-forwarded-for,
          país aproximado si el proveedor lo informa y accept-language.
        </p>
        <p className="text-muted-foreground">
          Esta información no se usa para perfilar comercialmente a la persona.
          Su finalidad es demostrar aceptación, investigar abuso, resolver
          disputas y proteger a la comunidad y a las personas responsables de la
          app.
        </p>
      </LegalSection>

      <LegalSection title="Derechos ARCO y solicitudes">
        <LegalList items={rights} />
        <p className="text-muted-foreground">
          Para ejercer estos derechos, la persona interesada debe indicar qué
          información quiere revisar, corregir, ocultar o eliminar. El equipo
          administrador podrá pedir datos mínimos para confirmar identidad y
          evitar cambios no autorizados.
        </p>
      </LegalSection>

      <LegalSection title="Conservación y seguridad">
        <p className="text-muted-foreground">
          Los datos se conservarán mientras sean útiles para la administración
          de la reta, historial deportivo, seguridad o cumplimiento de
          solicitudes. Se recomienda revisar periódicamente jugadores inactivos,
          fotos, comentarios y datos técnicos para eliminar lo que ya no sea
          necesario.
        </p>
      </LegalSection>

      <LegalReferences />
    </LegalShell>
  );
}
