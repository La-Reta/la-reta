import { Stack } from "expo-router";

import { TabStack } from "@/components/tab-stack";

export default function PartidosLayout() {
  return (
    <TabStack>
      <Stack.Screen name="partidos" options={{ title: "Partidos" }} />
      {/* Compartida entre pestañas; el título lo pone la propia ficha. */}
      <Stack.Screen name="partido/[id]" />
    </TabStack>
  );
}
