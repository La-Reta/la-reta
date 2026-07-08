import { PlayerSignupForm } from "@/components/features/players/player-signup-form";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Registrarme como jugador · Reta Fútbol" };

export default function PlayerSignupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Únete a la reta
        </h1>
        <p className="text-muted-foreground text-sm">
          Regístrate como jugador. Solo tus datos básicos — el nivel lo define
          el equipo al darte de alta.
        </p>
      </div>
      <PlayerSignupForm />
    </div>
  );
}
