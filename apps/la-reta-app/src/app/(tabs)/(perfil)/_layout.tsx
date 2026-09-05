import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PerfilLayout() {
  return (
    <TabStack>
      <Stack.Screen name="perfil" options={{ title: "Perfil" }} />
      <Stack.Screen name="diagnostico" options={{ title: "Diagnóstico" }} />
    </TabStack>
  );
}
