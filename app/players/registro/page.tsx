import { PlayerSignupForm } from "@/components/features/players/player-signup-form";
import { PageHeader } from "@/components/shared/page-header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarme como jugador · Reta Fútbol",
};

export default function PlayerSignupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Únete a la reta"
        description="Regístrate como jugador. Solo tus datos básicos — el nivel lo define el equipo al darte de alta."
      />
      <PlayerSignupForm />
    </div>
  );
}
