import { useRouter } from "expo-router";
import { ScrollView } from "react-native";

import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { closeOverlay } from "@/lib/navigation";

/**
 * Lo que se ve si falta `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.
 *
 * Sin llave no hay `ClerkProvider`, y un `useSignIn()` ahí revienta la app. Más
 * vale decir qué falta que enseñar un formulario que no puede funcionar.
 */
export function AuthUnavailable() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.four,
        padding: Spacing.four,
      }}
    >
      <Notice
        detail="Falta EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY en apps/la-reta-app/.env. Copia la de .env.example y reinicia el servidor de Expo."
        title="Clerk no está configurado"
      />
      <Button
        label="Volver"
        onPress={() => closeOverlay(router, "/")}
        style={{ alignSelf: "flex-start" }}
        variant="ghost"
      />
    </ScrollView>
  );
}
