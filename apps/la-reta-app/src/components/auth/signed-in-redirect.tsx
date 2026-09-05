import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useEffect } from "react";

/**
 * Saca de la portada a quien ya tiene sesión.
 *
 * La sesión se restaura del keychain de forma asíncrona, así que hay que
 * esperar a `isLoaded`: actuar antes mandaría a todo el mundo a la pantalla de
 * "crea tu cuenta" en cada arranque.
 */
export function SignedInRedirect() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/inicio");
    }
  }, [isLoaded, isSignedIn, router]);

  return null;
}
