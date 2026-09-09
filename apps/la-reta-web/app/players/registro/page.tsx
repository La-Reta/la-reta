import { SignupGate } from "@/components/features/players/signup-gate";
import { PageHeader } from "@/components/shared/page-header";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registrarme como jugador · Reta Fútbol",
};

// `auth()` lee la petición, así que esta ruta no se puede prerenderizar.
export const dynamic = "force-dynamic";

const PlayerSignupPage = async () => {
  // La sesión se resuelve aquí para que quien ya la tiene vea el formulario en
  // el primer pintado, sin el parpadeo de la puerta mientras Clerk arranca en
  // el cliente. A partir de ahí manda `useAuth()`, que es quien se entera de
  // que alguien acaba de crear su cuenta en el diálogo.
  const { userId } = await auth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Únete a la reta"
        description="Regístrate como jugador. Solo tus datos básicos — el nivel lo define el equipo al darte de alta."
      />
      <SignupGate initialSignedIn={Boolean(userId)} />
    </div>
  );
};

export default PlayerSignupPage;
