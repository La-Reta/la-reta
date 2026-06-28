import {
  LegalList,
  LegalNote,
  LegalSection,
  LegalShell,
} from "@/components/features/legal/legal-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de uso · Reta Credix",
  description:
    "Términos básicos de uso, contenido comunitario, marcas de terceros y responsabilidades en Reta Credix.",
};

const allowedUse = [
  "Consultar jugadores, estadísticas, partidos, ideas y contenido comunitario relacionado con la reta.",
  "Crear o editar información cuando se tenga permiso de administración o autorización de las personas involucradas.",
  "Compartir ideas, comentarios o palabras sin insultos, amenazas, acoso, discriminación o datos personales innecesarios.",
  "Reportar errores, datos incorrectos, imágenes no autorizadas o contenido que pueda afectar a una persona o marca.",
];

const forbiddenUse = [
  "Usar la app para hostigar, exponer, difamar o ridiculizar a jugadores, visitantes o administradores.",
  "Subir imágenes, nombres, logos o marcas sin autorización cuando puedan causar confusión, dañar derechos o hacerse pasar por una entidad oficial.",
  "Publicar datos sensibles o privados que no sean necesarios para la reta, como documentos oficiales, direcciones, teléfonos, información financiera o salud.",
  "Intentar extraer, vender, automatizar o reutilizar la base de datos para fines ajenos a la comunidad sin autorización.",
];

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="Términos de uso"
      title="Uso simple, respetuoso y sin confusiones"
      description="Estos términos definen cómo se debe usar Reta Credix, qué contenido es aceptable y cómo se manejan nombres, imágenes y marcas de terceros."
    >
      <LegalNote>
        Reta Credix es una herramienta comunitaria para organizar partidos,
        jugadores, ideas y estadísticas. No es una plataforma oficial de FIFA,
        EA SPORTS, CredixGS, Credix de Chile ni de ninguna entidad financiera o
        deportiva.
      </LegalNote>

      <LegalSection title="Uso permitido">
        <LegalList items={allowedUse} />
      </LegalSection>

      <LegalSection title="Uso no permitido">
        <LegalList items={forbiddenUse} />
      </LegalSection>

      <LegalSection title="Nombre Credix y marcas de terceros">
        <p className="text-muted-foreground">
          El uso de “Credix” dentro de esta app funciona como referencia
          comunitaria o nombre informal de la reta. No busca aprovecharse de la
          reputación, identidad comercial, productos, servicios o marcas de
          CredixGS, Credix de Chile u otras personas o entidades que usen ese
          nombre.
        </p>
        <p className="text-muted-foreground">
          Cualquier mención a FIFA, EA SPORTS, clubes, selecciones, logos,
          torneos o estilos visuales inspirados en videojuegos de fútbol se
          entiende como referencia estética o cultural. No implica autorización,
          patrocinio, colaboración, licencia ni relación oficial.
        </p>
        <p className="text-muted-foreground">
          Si un titular de derechos considera que existe confusión, uso indebido
          o afectación, puede pedir al equipo administrador que revise el caso.
          La app podrá cambiar nombres, retirar elementos visuales o agregar
          aclaraciones para evitar problemas.
        </p>
      </LegalSection>

      <LegalSection title="Contenido de usuarios y jugadores">
        <p className="text-muted-foreground">
          Quien envía ideas, palabras, comentarios o datos declara que tiene
          derecho o autorización para compartirlos. El equipo administrador
          puede editar, ocultar o eliminar contenido para proteger privacidad,
          seguridad, convivencia, derechos de imagen o derechos de marca.
        </p>
        <p className="text-muted-foreground">
          Las estadísticas deportivas son recreativas. Pueden contener errores,
          cambios manuales o criterios subjetivos, por lo que no deben usarse
          para evaluaciones profesionales, laborales, económicas o decisiones
          relevantes fuera de la reta.
        </p>
      </LegalSection>

      <LegalSection title="Cambios y disponibilidad">
        <p className="text-muted-foreground">
          La app puede cambiar rutas, diseño, datos, permisos o funciones sin
          aviso previo cuando sea necesario para mejorar la experiencia,
          corregir errores o proteger a la comunidad. Si el cambio afecta
          privacidad o uso de IA, se debe actualizar la documentación legal.
        </p>
      </LegalSection>
    </LegalShell>
  );
}
