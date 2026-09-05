import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Entrada con Google por SSO de navegador.
 *
 * Es el único camino que funciona en Expo Go: las variantes nativas
 * (`useSignInWithGoogle`, los componentes prefabricados) necesitan una build de
 * desarrollo. `startSSOFlow` abre la sesión del navegador, resuelve el
 * intercambio y, si crea sesión, la activamos con `setActive`.
 *
 * Cancelar no es un error: resuelve con `createdSessionId: null`, y ahí no hay
 * nada que decirle al usuario.
 *
 * El botón va sin el logotipo de Google a propósito: su marca tiene guías de
 * uso estrictas y un dibujo aproximado se ve peor que no ponerlo. Cuando haya
 * que cumplirlas, aquí entra el asset oficial.
 */
export function GoogleButton({
  onError,
}: {
  onError: (message: string) => void;
}) {
  const router = useRouter();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace("/inicio");
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : "No pudimos abrir el acceso con Google."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      label="Continuar con Google"
      loading={busy}
      onPress={start}
      variant="ghost"
    />
  );
}
