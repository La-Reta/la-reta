import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function InicioLayout() {
  return (
    <TabStack>
      <Stack.Screen name="inicio" options={{ title: "La Reta" }} />
      {/* Compartida entre pestañas; el título lo pone la propia ficha. */}
      <Stack.Screen name="jugador/[id]" />
      <Stack.Screen name="partido/[id]" />
    </TabStack>
  );
}
