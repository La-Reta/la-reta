import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { useEffect, type PropsWithChildren } from "react";

import { setSessionTokenProvider } from "@/lib/api";

/**
 * Monta Clerk solo si hay llave publicable.
 *
 * `ClerkProvider` lanza si la llave falta, y ahora mismo la app se usa sin
 * cuenta: sin esta guarda, un `.env` incompleto rompería el arranque en vez de
 * degradar a la parte pública, que es la que hoy tiene contenido. En cuanto la
 * llave exista, el proveedor y el keychain entran solos.
 */
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

/**
 * Constante de compilación: `EXPO_PUBLIC_*` se sustituye al empaquetar, así que
 * su valor no cambia en caliente. Eso permite ramificar con ella antes de
 * llamar a un hook de Clerk sin romper el orden de los hooks — cualquier
 * pantalla que use `useUser` o `useSignIn` tiene que comprobarla primero, o
 * reventaría al faltar el proveedor.
 */
export const isClerkConfigured = Boolean(publishableKey);

export function AuthProvider({ children }: PropsWithChildren) {
  if (!publishableKey) {
    return children;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <SessionTokenBridge />
      {children}
    </ClerkProvider>
  );
}

/**
 * Le pasa el token de sesión al cliente de la API. El backend lee el
 * `Authorization: Bearer` igual que la cookie de la web, así que con esto una
 * petición desde el móvil vale lo mismo que una desde el navegador.
 */
function SessionTokenBridge() {
  const { getToken } = useAuth();

  useEffect(() => {
    setSessionTokenProvider(() => getToken());
  }, [getToken]);

  return null;
}
