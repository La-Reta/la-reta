import type { Metadata } from "next";
import { SearchXIcon } from "lucide-react";
import { ErrorState } from "@/components/app/error-state";

export const metadata: Metadata = {
  title: "No encontrado · Reta Fútbol",
};

export default function NotFound() {
  return (
    <ErrorState
      code="404"
      icon={<SearchXIcon />}
      title="No encontramos esta jugada"
      description="La página pudo moverse, eliminarse o quizá el enlace no existe dentro de la reta."
      details="Puedes volver al inicio o revisar el historial de partidos para retomar desde una vista conocida."
    />
  );
}
