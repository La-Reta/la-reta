import {
  PlayerForm,
  type PlayerFormPrefill,
} from "@/components/features/players/player-form";
import { isAdmin } from "@/lib/admin";
import { getPlayerSignupById } from "@/lib/queries";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Nuevo jugador · Reta Fútbol" };
export const dynamic = "force-dynamic";

export default async function NewPlayerPage({
  searchParams,
}: {
  searchParams: Promise<{ signup?: string }>;
}) {
  const [{ signup }, admin, { userId }] = await Promise.all([
    searchParams,
    isAdmin(),
    auth(),
  ]);

  // Admins can prefill from a pending signup request.
  let prefill: PlayerFormPrefill | undefined;
  const signupId = Number(signup);
  if (admin && Number.isFinite(signupId) && signupId > 0) {
    const s = await getPlayerSignupById(signupId);
    if (s) {
      prefill = {
        name: s.name,
        displayName: s.displayName ?? "",
        position: s.position,
        position2: s.position2 ?? "",
        preferredFoot: s.preferredFoot,
        nationality: s.nationality,
        photoUrl: s.photoUrl ?? "",
        birthDate: s.birthDate ?? "",
        ...(s.heightCm != null ? { heightCm: String(s.heightCm) } : {}),
        ...(s.weightKg != null ? { weightKg: String(s.weightKg) } : {}),
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo jugador</h1>
        <p className="text-muted-foreground text-sm">
          {prefill
            ? "Datos precargados desde la solicitud. Ajusta los atributos y guarda."
            : "Define sus datos y atributos. El overall se calcula según la posición."}
        </p>
      </div>
      <PlayerForm canManage={admin || Boolean(userId)} prefill={prefill} />
    </div>
  );
}
