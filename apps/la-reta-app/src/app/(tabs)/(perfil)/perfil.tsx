import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";

import { AccountCard } from "@/components/auth/account-card";
import { Row } from "@/components/ui/row";
import { Section } from "@/components/ui/section";
import { Text } from "@/components/ui/text";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { API_URL } from "@/lib/api";

/**
 * Perfil. Arriba la sesión —quién eres o cómo entrar— y debajo lo que funciona
 * con cuenta y sin ella.
 */
export default function PerfilScreen() {
  const router = useRouter();

  const openWeb = useCallback((path: string) => {
    WebBrowser.openBrowserAsync(`${API_URL}${path}`);
  }, []);

  return (
    <ScrollView
      contentContainerStyle={{
        alignSelf: "center",
        width: "100%",
        maxWidth: MaxContentWidth,
        gap: Spacing.five,
        paddingHorizontal: Spacing.four,
        paddingTop: Spacing.three,
        paddingBottom: BottomTabInset + Spacing.five,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <AccountCard />

      <Section title="La reta en la web">
        <View>
          <Row
            detail="Ruleta de quién lava las casacas"
            icon="jersey"
            onPress={() => openWeb("/casacas")}
            title="Casacas"
          />
          <Row
            detail="Propuestas y mejoras de la banda"
            icon="spark"
            onPress={() => openWeb("/ideas")}
            title="Ideas"
          />
          <Row
            detail="Privacidad, términos y uso de IA"
            icon="shield"
            last
            onPress={() => openWeb("/legal")}
            title="Legal"
          />
        </View>
      </Section>

      <Section title="Desarrollo">
        <View>
          <Row
            detail="Probar los endpoints y el gate de PIN"
            icon="pulse"
            last
            onPress={() => router.push("/diagnostico")}
            title="Diagnóstico de la API"
          />
        </View>
      </Section>

      <Text
        selectable
        style={{ textAlign: "center" }}
        tone="faint"
        variant="caption"
      >
        {API_URL}
      </Text>
    </ScrollView>
  );
}
