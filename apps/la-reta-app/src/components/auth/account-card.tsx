import { useAuth, useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { View } from "react-native";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Surface } from "@/components/ui/surface";
import { Text } from "@/components/ui/text";
import { Palette, Radius, Spacing } from "@/constants/theme";
import { initials } from "@/lib/photos";

/**
 * La tarjeta de sesión del perfil: quién eres, o cómo entrar si no lo eres.
 *
 * Se apoya en `useUser`, así que solo se monta cuando Clerk está configurado
 * (ver `isClerkConfigured`). `isLoaded` va antes que `isSignedIn`: durante el
 * primer instante la sesión aún se está restaurando del keychain y dar por
 * hecho que no hay nadie haría parpadear "Sin sesión" en cada arranque.
 */
export function AccountCard() {
  const router = useRouter();
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <Surface style={{ height: 132, justifyContent: "center" }}>
        <Text tone="faint" variant="caption">
          Restaurando tu sesión…
        </Text>
      </Surface>
    );
  }

  if (!isSignedIn) {
    return <SignedOut onPress={(href) => router.push(href)} />;
  }

  const displayName =
    user?.fullName ?? user?.firstName ?? user?.username ?? "Tu cuenta";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <Surface style={{ gap: Spacing.four, padding: Spacing.four }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: Radius.pill,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: Palette.line,
            backgroundColor: Palette.accentSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {user?.imageUrl ? (
            <Image
              accessibilityIgnoresInvertColors
              alt={displayName}
              contentFit="cover"
              source={user.imageUrl}
              style={{ width: "100%", height: "100%" }}
              transition={180}
            />
          ) : (
            <Text style={{ color: Palette.accent }} variant="statSmall">
              {initials(displayName)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text numberOfLines={1} variant="title">
            {displayName}
          </Text>
          {email ? (
            <Text numberOfLines={1} selectable tone="muted" variant="caption">
              {email}
            </Text>
          ) : null}
        </View>
      </View>

      <Button
        label="Cerrar sesión"
        onPress={() => signOut()}
        size="md"
        style={{ alignSelf: "flex-start" }}
        variant="ghost"
      />
    </Surface>
  );
}

function SignedOut({
  onPress,
}: {
  onPress: (href: "/sign-in" | "/sign-up") => void;
}) {
  return (
    <Surface style={{ gap: Spacing.four, padding: Spacing.four }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: Spacing.three,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: Radius.pill,
            borderWidth: 1,
            borderColor: Palette.line,
            backgroundColor: Palette.surfaceSunken,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon color={Palette.inkFaint} name="person" size={26} />
        </View>

        <View style={{ flex: 1, gap: Spacing.half }}>
          <Text variant="title">Sin sesión</Text>
          <Text tone="muted" variant="caption">
            Entra para reclamar tu ficha, votar el MVP y ver tu historial.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: Spacing.two }}>
        <Button
          flex={1}
          label="Iniciar sesión"
          onPress={() => onPress("/sign-in")}
          variant="glass"
        />
        <Button
          flex={1.3}
          label="Crear cuenta"
          onPress={() => onPress("/sign-up")}
          variant="primary"
        />
      </View>
    </Surface>
  );
}
